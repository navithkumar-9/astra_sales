import os
from django.test import TestCase
from django.core import mail
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.cache import cache
from unittest.mock import patch

from core.models.enquiry import Enquiry
from core.models.customer import Customer
from core.models.sbu import SBU
from core.models.division import Division
from core.models.rfq import RFQ
from core.models.fg import FG
from core.models.mail import Mail
from core.models.email_log import EmailLog

from core.services.email_service import EmailService
from core.services.report_service import ReportService
from core.services.attachment_service import AttachmentService
from core.tasks.mail_tasks import send_mail_all_task

User = get_user_model()

class EmailReportingTestCase(TestCase):
    def setUp(self):
        # Clear cache and mock cache to avoid interference from other tests or runs
        cache.clear()
        self.cache_patcher = patch('core.services.cache_service.CacheService.get_dashboard_stats', return_value=None)
        self.cache_patcher.start()

        # Create master data
        self.customer = Customer.objects.create(name="Globex Corp")
        self.sbu = SBU.objects.create(name="Engineering SBU")
        self.division = Division.objects.create(name="Mysore Division")
        self.rfq_type = RFQ.objects.create(name="Boughtout")
        self.fg_type = FG.objects.create(fg_type="FG Type A")
        
        # Create sales rep
        self.sales_rep = User.objects.create_user(
            username="rep1", 
            role="SALES_REP", 
            name="John Rep", 
            password="password"
        )
        
        # Create a few enquiries (some open, some terminal)
        self.open_enquiry = Enquiry.objects.create(
            project_number="PRJ-OPEN",
            rfq_date=timezone.now().date(),
            rfq_no="RFQ-111",
            customer=self.customer,
            sbu=self.sbu,
            project_name="Open Project",
            division=self.division,
            rfq_due_date=timezone.now().date(),
            rfq_due_time="17:00:00",
            rfq_assign_date=timezone.now().date(),
            rfq_type=self.rfq_type,
            fg_type=self.fg_type,
            sales_rep=self.sales_rep,
            status="Pending with Engg",
            quote_value=1250000.00,
            po_value=0.00,
            open_l1_value=0.00,
            lost_value=0.00
        )

        self.won_enquiry = Enquiry.objects.create(
            project_number="PRJ-WON",
            rfq_date=timezone.now().date(),
            rfq_no="RFQ-222",
            customer=self.customer,
            sbu=self.sbu,
            project_name="Won Project",
            division=self.division,
            rfq_due_date=timezone.now().date(),
            rfq_due_time="17:00:00",
            rfq_assign_date=timezone.now().date(),
            rfq_type=self.rfq_type,
            fg_type=self.fg_type,
            sales_rep=self.sales_rep,
            status="Won",
            quote_value=5000000.00,
            po_value=4800000.00,
            open_l1_value=0.00,
            lost_value=0.00
        )

        # Create mail recipients
        self.recipient_1 = Mail.objects.create(email="manager1@globex.com")
        self.recipient_2 = Mail.objects.create(email="director2@globex.com")

    def tearDown(self):
        # Stop cache patcher and clean up database
        self.cache_patcher.stop()
        cache.clear()

    def test_email_template_rendering(self):
        """Test that the email template renders correct HTML and includes dynamic variables."""
        body = EmailService.compose_crm_report_body()
        
        # Check that the dynamic headers are present
        self.assertIn("Please find the below summary and open RFQ status as on today", body)
        self.assertIn("Note: Displaying data from 1st April 2026.", body)
        
        # Check that humanized KPI values are present
        # Total Enquiry should be 2, Won 1, Pending with Engg 1
        self.assertIn("Total Enquiry", body)
        self.assertIn("Overall Pending", body)
        self.assertIn("Won", body)
        
        # Quoted Value: 1,250,000 + 5,000,000 = 6,250,000 (with intcomma)
        self.assertIn("6,250,000", body)
        
        # Check that the open enquiry table is rendered
        self.assertIn("PRJ-OPEN", body)
        self.assertIn("Globex Corp", body)
        self.assertIn("Pending with Engg", body)
        
        # Terminal/Won enquiries should NOT be listed in the open RFQ table
        self.assertNotIn("PRJ-WON", body)

    def test_report_service_generation(self):
        """Test that ReportService generates a CSV file with correct data and name."""
        report_path = ReportService.generate_latest_rfq_report()
        
        self.assertTrue(os.path.exists(report_path))
        self.assertTrue(report_path.endswith(".csv"))
        self.assertIn("Daily-Tracker-", report_path)
        
        # Read the file content
        with open(report_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Verify CSV headers
        self.assertIn("Customer Name", content)
        self.assertIn("SBU", content)
        self.assertIn("Division", content)
        self.assertIn("RFQ Type", content)
        
        # Verify CSV rows contain records (since project_number is not exported in CSV, verify via Customer and Division names)
        self.assertIn("Globex Corp", content)
        self.assertIn("Mysore Division", content)
        self.assertIn("Pending with Engg", content)
        self.assertNotIn("Won", content)
        
        # Clean up generated file
        if os.path.exists(report_path):
            os.remove(report_path)

    def test_attachment_service(self):
        """Test that AttachmentService successfully attaches a file to EmailMessage."""
        email = mail.EmailMessage(
            subject="Test Attach",
            body="Hello",
            from_email="test@astracrm.com",
            to=["recipient@test.com"]
        )
        
        # Create a temp file
        temp_path = "temp_test_attachment.csv"
        with open(temp_path, 'w') as f:
            f.write("Col1,Col2\nVal1,Val2")
            
        try:
            AttachmentService.attach_file(email, temp_path)
            self.assertEqual(len(email.attachments), 1)
            self.assertEqual(email.attachments[0][0], "temp_test_attachment.csv")
            
            # Handle both string and bytes formatting of attachment content
            attached_content = email.attachments[0][1]
            if isinstance(attached_content, bytes):
                attached_content = attached_content.decode('utf-8')
            self.assertEqual(attached_content, "Col1,Col2\nVal1,Val2")
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def test_send_mail_all_task_success(self):
        """Test the send_mail_all_task Celery task triggers and sends emails with attachments."""
        # Ensure mail outbox is clean
        mail.outbox = []
        
        # Trigger Celery task
        result = send_mail_all_task(triggered_by_id=self.sales_rep.id)
        
        self.assertIn("complete", result)
        
        # Verify emails were sent
        self.assertEqual(len(mail.outbox), 2)
        
        for sent_mail in mail.outbox:
            self.assertEqual(len(sent_mail.attachments), 1)
            self.assertIn("Daily-Tracker-", sent_mail.attachments[0][0])
            self.assertTrue(sent_mail.attachments[0][0].endswith(".csv"))
            self.assertIn("RFQ Update - ", sent_mail.subject)
            
        # Verify EmailLog entries are created in database
        logs = EmailLog.objects.all()
        self.assertEqual(logs.count(), 2)
        for log in logs:
            self.assertEqual(log.status, EmailLog.Status.SENT)
            self.assertEqual(log.triggered_by, self.sales_rep)

    @patch('core.services.report_service.ReportService.generate_latest_rfq_report')
    def test_send_mail_all_task_report_failure_graceful(self, mock_generate_report):
        """Test that if report generation raises an error, emails are still sent without attachments."""
        # Mock generator to fail
        mock_generate_report.side_effect = Exception("Disk capacity exceeded")
        
        mail.outbox = []
        
        # Trigger Celery task
        result = send_mail_all_task(triggered_by_id=self.sales_rep.id)
        
        self.assertIn("complete", result)
        
        # Verify emails were sent but have NO attachments
        self.assertEqual(len(mail.outbox), 2)
        for sent_mail in mail.outbox:
            self.assertEqual(len(sent_mail.attachments), 0)
            
        # Logs should still reflect SENT status for emails
        logs = EmailLog.objects.all()
        self.assertEqual(logs.count(), 2)
        for log in logs:
            self.assertEqual(log.status, EmailLog.Status.SENT)
