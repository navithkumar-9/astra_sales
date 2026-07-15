from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError, PermissionDenied
from core.models.enquiry import Enquiry
from core.models.customer import Customer
from core.models.sbu import SBU
from core.models.division import Division
from core.models.rfq import RFQ
from core.models.fg import FG
from core.services.enquiry_service import EnquiryService
from core.services.workflow_engine import WorkflowEngine

User = get_user_model()

class WorkflowEngineTestCase(TestCase):
    def setUp(self):
        # Create master data
        self.customer = Customer.objects.create(name="Test Customer")
        self.sbu = SBU.objects.create(name="Test SBU")
        self.division = Division.objects.create(name="Test Division")
        self.rfq_type = RFQ.objects.create(name="Budgetary RFQ")
        self.fg_type = FG.objects.create(fg_type="FG Type A")
        
        # Create users of different roles
        self.superadmin = User.objects.create_user(username="superadmin", role="SUPERADMIN", password="password")
        self.admin = User.objects.create_user(username="admin", role="ADMIN", password="password")
        self.rfq_tracker = User.objects.create_user(username="tracker", role="RFQ_TRACKER", password="password")
        self.sales_rep = User.objects.create_user(username="rep", role="SALES_REP", password="password")
        
        # Create a base enquiry (starts in Pending with Engg)
        self.enquiry = Enquiry.objects.create(
            project_number="PRJ-100",
            rfq_date="2026-07-01",
            rfq_no="RFQ-100",
            customer=self.customer,
            sbu=self.sbu,
            project_name="Test Project",
            division=self.division,
            rfq_due_date="2026-08-01",
            rfq_due_time="17:00:00",
            rfq_assign_date="2026-07-02",
            rfq_type=self.rfq_type,
            fg_type=self.fg_type,
            sales_rep=self.sales_rep
        )

    def test_auto_advance_flow(self):
        # Starts in Pending with Engg
        self.assertEqual(self.enquiry.status, 'Pending with Engg')
        
        # If we fill engineering fields, it should auto-advance to Pending with Costing
        self.enquiry = EnquiryService.update_enquiry(
            self.enquiry,
            {
                'ed_of_engg': '2026-07-10',
                'actual_date_of_engg': '2026-07-11',
                'engg_remarks': 'Engineering complete.'
            },
            self.rfq_tracker
        )
        self.assertEqual(self.enquiry.status, 'Pending with Costing')

        # If we fill costing fields, it should auto-advance to Sales to Quote
        self.enquiry = EnquiryService.update_enquiry(
            self.enquiry,
            {
                'ed_of_costing': '2026-07-15',
                'actual_date_of_costing': '2026-07-16',
                'costing_remarks': 'Costing complete.'
            },
            self.rfq_tracker
        )
        self.assertEqual(self.enquiry.status, 'Sales to Quote')

        # If we fill quote details, it should auto-advance to Pending with Sales
        self.enquiry = EnquiryService.update_enquiry(
            self.enquiry,
            {
                'quote_date': '2026-07-20',
                'quote_value': 50000.00
            },
            self.sales_rep
        )
        self.assertEqual(self.enquiry.status, 'Pending with Sales')

    def test_prevent_skipping_stages(self):
        # Attempting to move manually from Pending with Engg directly to Pending with Sales should fail
        with self.assertRaises(ValidationError):
            EnquiryService.update_enquiry(
                self.enquiry,
                {'status': 'Pending with Sales'},
                self.sales_rep
            )

    def test_stage_field_permissions(self):
        # In Pending with Engg, editing costing fields should fail for non-admins
        with self.assertRaises(PermissionDenied):
            EnquiryService.update_enquiry(
                self.enquiry,
                {'actual_date_of_costing': '2026-07-15'},
                self.rfq_tracker
            )

        # Admin can override and edit anything
        self.enquiry = EnquiryService.update_enquiry(
            self.enquiry,
            {'actual_date_of_costing': '2026-07-15'},
            self.admin
        )
        self.assertEqual(str(self.enquiry.actual_date_of_costing), '2026-07-15')

    def test_terminal_statuses_transition_to_any(self):
        # Set status to Won
        self.enquiry.status = 'Won'
        self.enquiry.save()

        # Try to transition from Won to Pending with Engg - should be allowed for Sales Rep/RFQ Tracker
        self.enquiry = EnquiryService.update_enquiry(
            self.enquiry,
            {'status': 'Pending with Engg'},
            self.sales_rep
        )
        self.assertEqual(self.enquiry.status, 'Pending with Engg')
        # Check that engineering dates were cleared
        self.assertIsNone(self.enquiry.ed_of_engg)
        self.assertIsNone(self.enquiry.actual_date_of_engg)

        # Set status to On Hold
        self.enquiry.status = 'On Hold'
        self.enquiry.save()

        # Try to transition from On Hold to Pending with Costing
        self.enquiry = EnquiryService.update_enquiry(
            self.enquiry,
            {'status': 'Pending with Costing'},
            self.rfq_tracker
        )
        self.assertEqual(self.enquiry.status, 'Pending with Costing')
