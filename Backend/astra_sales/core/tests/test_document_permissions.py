from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model
from core.models.enquiry import Enquiry
from core.models.customer import Customer
from core.models.sbu import SBU
from core.models.division import Division
from core.models.rfq import RFQ
from core.models.fg import FG
from core.serializers.enquiry import EnquirySerializer

User = get_user_model()

class DocumentPermissionsTestCase(TestCase):
    def setUp(self):
        self.customer = Customer.objects.create(name="Test Customer")
        self.sbu = SBU.objects.create(name="Test SBU")
        self.division = Division.objects.create(name="Test Division")
        self.rfq_type = RFQ.objects.create(name="Budgetary RFQ")
        self.fg_type = FG.objects.create(fg_type="FG Type A")
        self.user = User.objects.create_user(username="testuser", role="ADMIN", password="password")

        # Fake files
        self.test_rfq_file = SimpleUploadedFile("rfq.pdf", b"file_content", content_type="application/pdf")
        self.test_po_file = SimpleUploadedFile("po.pdf", b"file_content", content_type="application/pdf")

    def test_upload_on_create_fails_before_won(self):
        # Trying to create an enquiry with documents in 'Pending with Engg' status must raise ValidationError
        serializer = EnquirySerializer(data={
            'project_number': "PRJ-999",
            'rfq_date': "2026-07-01",
            'rfq_no': "RFQ-999",
            'customer': self.customer.id,
            'sbu': self.sbu.id,
            'project_name': "Test Proj",
            'division': self.division.id,
            'rfq_due_date': "2026-08-01",
            'rfq_due_time': "17:00:00",
            'rfq_assign_date': "2026-07-02",
            'rfq_type': self.rfq_type.id,
            'fg_type': self.fg_type.id,
            'sales_rep': self.user.id,
            'fg_details': [],
            'status': 'Pending with Engg',
            'rfq_document': self.test_rfq_file
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('rfq_document', serializer.errors)

    def test_upload_on_update_fails_before_won(self):
        # Create an enquiry without documents
        enquiry = Enquiry.objects.create(
            project_number="PRJ-999",
            rfq_date="2026-07-01",
            rfq_no="RFQ-999",
            customer=self.customer,
            sbu=self.sbu,
            project_name="Test Proj",
            division=self.division,
            rfq_due_date="2026-08-01",
            rfq_due_time="17:00:00",
            rfq_assign_date="2026-07-02",
            rfq_type=self.rfq_type,
            fg_type=self.fg_type,
            sales_rep=self.user,
            status='Pending with Engg'
        )

        # Attempt to upload document via serializer in 'Pending with Engg' stage
        serializer = EnquirySerializer(instance=enquiry, data={
            'rfq_document': self.test_rfq_file
        }, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('rfq_document', serializer.errors)

        # Attempt to upload document via model.save() directly
        enquiry.rfq_document = self.test_rfq_file
        with self.assertRaises(DjangoValidationError):
            enquiry.save()

    def test_upload_succeeds_when_won(self):
        # Create an enquiry with status Won
        enquiry = Enquiry.objects.create(
            project_number="PRJ-999",
            rfq_date="2026-07-01",
            rfq_no="RFQ-999",
            customer=self.customer,
            sbu=self.sbu,
            project_name="Test Proj",
            division=self.division,
            rfq_due_date="2026-08-01",
            rfq_due_time="17:00:00",
            rfq_assign_date="2026-07-02",
            rfq_type=self.rfq_type,
            fg_type=self.fg_type,
            sales_rep=self.user,
            status='Won'
        )

        # Serializer should validate successfully since status is Won
        serializer = EnquirySerializer(instance=enquiry, data={
            'rfq_document': self.test_rfq_file,
            'po_document': self.test_po_file
        }, partial=True)
        self.assertTrue(serializer.is_valid())

    def test_transition_to_won_with_document_succeeds(self):
        enquiry = Enquiry.objects.create(
            project_number="PRJ-999",
            rfq_date="2026-07-01",
            rfq_no="RFQ-999",
            customer=self.customer,
            sbu=self.sbu,
            project_name="Test Proj",
            division=self.division,
            rfq_due_date="2026-08-01",
            rfq_due_time="17:00:00",
            rfq_assign_date="2026-07-02",
            rfq_type=self.rfq_type,
            fg_type=self.fg_type,
            sales_rep=self.user,
            status='Pending with Sales'
        )

        # Transitioning status to Won and uploading files in the same serializer request must succeed
        serializer = EnquirySerializer(instance=enquiry, data={
            'status': 'Won',
            'rfq_document': self.test_rfq_file
        }, partial=True)
        self.assertTrue(serializer.is_valid())

    def test_existing_documents_read_only_in_other_statuses(self):
        # Create a Won enquiry with existing documents
        enquiry = Enquiry.objects.create(
            project_number="PRJ-999",
            rfq_date="2026-07-01",
            rfq_no="RFQ-999",
            customer=self.customer,
            sbu=self.sbu,
            project_name="Test Proj",
            division=self.division,
            rfq_due_date="2026-08-01",
            rfq_due_time="17:00:00",
            rfq_assign_date="2026-07-02",
            rfq_type=self.rfq_type,
            fg_type=self.fg_type,
            sales_rep=self.user,
            status='Won',
            rfq_document=self.test_rfq_file
        )

        # Transition to On Hold (other status)
        enquiry.status = 'On Hold'
        enquiry.save() # No document changes, save should succeed

        # Try to modify another field without changing the document (serializer path passing back existing document URL)
        serializer = EnquirySerializer(instance=enquiry, data={
            'remarks': 'Testing hold',
            'rfq_document': enquiry.rfq_document.url
        }, partial=True)
        self.assertTrue(serializer.is_valid()) # Should be valid because document is not changed (popped by to_internal_value)
