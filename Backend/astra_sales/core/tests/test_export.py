import os
import csv
from django.test import TestCase
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock

from core.models.user import User
from core.models.customer import Customer
from core.models.sbu import SBU
from core.models.division import Division
from core.models.fg import FG
from core.models.rfq import RFQ
from core.models.enquiry import Enquiry
from core.models.export_job import ExportJob
from core.repositories.export_repository import ExportRepository
from core.services.export.writers.csv_writer import ChunkedCSVWriter
from core.services.export.strategies.csv_strategy import CSVExportStrategy
from core.services.export.storage.local_storage import LocalStorageProvider
from core.services.export.notifications.database_notifier import DatabaseNotificationService
from core.services.export_service import ExportService
from core.tasks.export_tasks import run_export_task

class ChunkedCSVWriterTest(TestCase):
    """Test standard formatting and Excel BOM formatting."""

    def test_write_header(self):
        headers = ["ColA", "ColB"]
        res = ChunkedCSVWriter.write_header(headers)
        # Prepend UTF-8 BOM (\xef\xbb\xbf)
        self.assertTrue(res.startswith(b'\xef\xbb\xbf'))
        # Row values check
        csv_data = res[3:].decode('utf-8')
        self.assertEqual(csv_data, "ColA,ColB\r\n")

    def test_write_rows(self):
        rows = [["Val1", "Val2"], ["Val3, Comma", "Val4\nNewline"]]
        res = ChunkedCSVWriter.write_rows(rows)
        csv_data = res.decode('utf-8')
        # Check commas and quotes escaping
        self.assertIn('"Val3, Comma"', csv_data)
        self.assertIn('"Val4\nNewline"', csv_data)


class CSVExportStrategyTest(TestCase):
    """Test query chunking and strategy pipeline."""

    def setUp(self):
        self.user = User.objects.create_user(username='testrep', role='SALES_REP')
        self.customer = Customer.objects.create(name='Test Customer')
        self.sbu = SBU.objects.create(name='Test SBU')
        self.division = Division.objects.create(name='Test Div')
        self.fg = FG.objects.create(fg_type='Test FG')
        self.rfq = RFQ.objects.create(name='Test RFQ')
        
        self.enquiry = Enquiry.objects.create(
            project_number='PRJ-TEST-1',
            rfq_date=timezone.now().date(),
            rfq_no='RFQ-TEST-1',
            customer=self.customer,
            sbu=self.sbu,
            project_name='Test project',
            division=self.division,
            rfq_due_date=timezone.now().date(),
            rfq_due_time=timezone.now().time(),
            rfq_assign_date=timezone.now().date(),
            rfq_type=self.rfq,
            fg_type=self.fg,
            sales_rep=self.user
        )

    def test_strategy_writes_csv(self):
        storage = LocalStorageProvider()
        strategy = CSVExportStrategy()
        file_key = "test_export_strategy.csv"

        callback_mock = MagicMock()
        completed_path = strategy.export(
            queryset=Enquiry.objects.all(),
            storage_provider=storage,
            file_key=file_key,
            progress_callback=callback_mock
        )

        self.assertTrue(os.path.exists(completed_path))
        callback_mock.assert_called()

        # Read back to ensure content is intact
        with open(completed_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            headers = next(reader)
            self.assertEqual(headers[0], "Project Number")
            self.assertEqual(headers[2], "RFQ No")
            
            row = next(reader)
            self.assertEqual(row[0], "PRJ-TEST-1")
            self.assertEqual(row[2], "RFQ-TEST-1")

        # Cleanup
        storage.delete(completed_path)


class ExportJobAPITestCase(APITestCase):
    """Test security, CRUD flow, and task triggers on endpoints."""

    def setUp(self):
        self.admin = User.objects.create_user(username='adminuser', password='password', role='ADMIN')
        self.sales_rep = User.objects.create_user(username='repuser', password='password', role='SALES_REP')
        self.other_user = User.objects.create_user(username='otheruser', password='password', role='SALES_REP')

        self.client.force_authenticate(user=self.admin)
        self.job = ExportJob.objects.create(
            user=self.admin,
            status='PENDING',
            progress=0
        )

    def test_trigger_export(self):
        url = reverse('exports_list_create')
        data = {'format': 'csv', 'filters': {'status': 'Won'}}
        response = self.client.post(url, data, format='json')
        
        # Immediate streaming download returns 200 OK with CSV attachments
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv; charset=utf-8')
        self.assertIn('attachment', response['Content-Disposition'])

    def test_get_progress(self):
        url = reverse('exports_detail', args=[self.job.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['status'], 'PENDING')

    def test_permissions_prevent_access(self):
        self.client.force_authenticate(user=self.other_user)
        url = reverse('exports_detail', args=[self.job.id])
        response = self.client.get(url)
        # Sales Rep cannot view Admin's export job
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cancel_export(self):
        url = reverse('exports_detail', args=[self.job.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(ExportJob.objects.filter(id=self.job.id).exists())


class ExportCeleryTaskTestCase(TestCase):
    """Test background task execution, updating database and error states."""

    def setUp(self):
        self.user = User.objects.create_user(username='taskrep', role='SALES_REP')
        self.job = ExportJob.objects.create(user=self.user, status='PENDING')

    @patch('core.services.export.strategies.csv_strategy.CSVExportStrategy.export')
    def test_run_export_task_success(self, mock_export):
        mock_export.return_value = "/tmp/test_export.csv"
        
        res = run_export_task(self.job.id, 'csv', {})
        self.assertIn("completed successfully", res)
        
        job = ExportJob.objects.get(id=self.job.id)
        self.assertEqual(job.status, 'COMPLETED')
        self.assertEqual(job.progress, 100)
        self.assertEqual(job.file_path, "/tmp/test_export.csv")

    @patch('core.services.export.strategies.csv_strategy.CSVExportStrategy.export', side_effect=Exception("Database issue"))
    def test_run_export_task_failure(self, mock_export):
        with self.assertRaises(Exception):
            run_export_task(self.job.id, 'csv', {})
            
        job = ExportJob.objects.get(id=self.job.id)
        self.assertEqual(job.status, 'FAILED')
        self.assertIn("Database issue", job.error_message)
