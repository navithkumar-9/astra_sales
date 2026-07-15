from rest_framework.exceptions import ValidationError, PermissionDenied
from core.models.enquiry import Enquiry

class WorkflowEngine:
    # Fields grouped by department
    ENGINEERING_FIELDS = {'ed_of_engg', 'actual_date_of_engg', 'engg_remarks'}
    COSTING_FIELDS = {'ed_of_costing', 'actual_date_of_costing', 'costing_remarks'}
    SALES_FIELDS = {
        'ed_of_sales', 'actual_date_of_sales', 'sales_remarks',
        'quote_date', 'quote_value', 'open_l1_value', 'open_l1_date', 'lost_value',
        'po_no', 'po_receipt_date', 'po_value', 'po_document'
    }

    # Valid transitions from each status (excluding self-transitions)
    # Status choices from Enquiry.StatusChoices:
    # PENDING_ENGG = 'Pending with Engg'
    # PENDING_COSTING = 'Pending with Costing'
    # SALES_TO_QUOTE = 'Sales to Quote'
    # PENDING_SALES = 'Pending with Sales'
    # QUOTE_SUBMITTED = 'Quote Submitted'
    # ON_HOLD = 'On Hold'
    # OPEN_L1 = 'Open - L1'
    # WON = 'Won'
    # LOST = 'Lost'
    # REGRETTED = 'Regretted'
    # QUOTE_REGRETTED = 'Quote Regretted'
    
    ALL_STATUSES = {
        'Pending with Engg', 'Pending with Costing', 'Sales to Quote',
        'Pending with Sales', 'Quote Submitted', 'On Hold', 'Open - L1',
        'Won', 'Lost', 'Regretted', 'Quote Regretted'
    }

    # Validation rules: "Users cannot manually skip stages"
    # Stage order is PENDING_ENGG -> PENDING_COSTING -> SALES_TO_QUOTE -> PENDING_SALES -> QUOTE_SUBMITTED
    # Other terminal or auxiliary statuses (ON_HOLD, OPEN_L1, WON, LOST, REGRETTED, QUOTE_REGRETTED)
    # can be transitioned to from SALES_TO_QUOTE, PENDING_SALES, or QUOTE_SUBMITTED.
    VALID_TRANSITIONS = {
        'Pending with Engg': {'Pending with Costing'},
        'Pending with Costing': {'Sales to Quote', 'Pending with Engg'},
        'Sales to Quote': {
            'Pending with Sales', 'On Hold', 'Regretted', 'Open - L1', 'Won', 'Lost', 'Quote Regretted'
        },
        'Pending with Sales': {
            'Quote Submitted', 'Pending with Engg', 'Pending with Costing', 'Sales to Quote'
        },
        'Quote Submitted': {
            'Pending with Sales', 'Sales to Quote', 'On Hold', 'Open - L1', 'Won', 'Lost', 'Regretted', 'Quote Regretted'
        },
        'On Hold': ALL_STATUSES,
        'Open - L1': ALL_STATUSES,
        'Won': ALL_STATUSES,
        'Lost': ALL_STATUSES,
        'Regretted': ALL_STATUSES,
        'Quote Regretted': ALL_STATUSES,
    }

    @classmethod
    def validate_transition(cls, enquiry: Enquiry, old_status: str, new_status: str, user):
        """
        Validate if the status transition is allowed.
        Enforces 'no skipping stages' and verifies stage change permissions.
        """
        if old_status == new_status:
            return

        # Superadmins/Admins can override manual transition constraints
        if user and user.role in ['SUPERADMIN', 'ADMIN']:
            return

        # Check transition map
        allowed = cls.VALID_TRANSITIONS.get(old_status, set())
        if new_status not in allowed:
            raise ValidationError({
                "status": f"Invalid stage transition from '{old_status}' to '{new_status}'. Users cannot skip stages."
            })

        # Validate mandatory fields before transition
        cls.validate_mandatory_fields_for_transition(enquiry, old_status, new_status)

    @classmethod
    def validate_mandatory_fields_for_transition(cls, enquiry: Enquiry, old_status: str, new_status: str):
        """
        Ensure all required fields for the current stage are completed before moving out of it.
        """
        if old_status == 'Pending with Engg' and new_status == 'Pending with Costing':
            if not enquiry.ed_of_engg or not enquiry.actual_date_of_engg:
                raise ValidationError({
                    "non_field_errors": "Cannot move to 'Pending with Costing'. Engineering Expected and Actual dates are mandatory."
                })

        elif old_status == 'Pending with Costing' and new_status == 'Sales to Quote':
            if not enquiry.ed_of_costing or not enquiry.actual_date_of_costing:
                raise ValidationError({
                    "non_field_errors": "Cannot move to 'Sales to Quote'. Costing Expected and Actual dates are mandatory."
                })

        elif old_status == 'Sales to Quote' and new_status == 'Pending with Sales':
            if not enquiry.quote_date or not enquiry.quote_value:
                raise ValidationError({
                    "non_field_errors": "Cannot move to 'Pending with Sales'. Quote Date and Quote Value are mandatory."
                })

    @classmethod
    def check_auto_advance(cls, enquiry: Enquiry) -> str:
        """
        Checks if the enquiry meets auto-advance requirements.
        Returns the new status if it should auto-advance, otherwise returns the current status.
        """
        current_status = enquiry.status

        if current_status == 'Pending with Engg':
            if enquiry.ed_of_engg and enquiry.actual_date_of_engg:
                return 'Pending with Costing'

        elif current_status == 'Pending with Costing':
            if enquiry.ed_of_costing and enquiry.actual_date_of_costing:
                return 'Sales to Quote'

        elif current_status == 'Sales to Quote':
            if enquiry.quote_date and enquiry.quote_value:
                return 'Pending with Sales'

        return current_status

    @classmethod
    def enforce_field_permissions(cls, enquiry: Enquiry, validated_data: dict, user):
        """
        Enforce Field Permissions Matrix.
        Raises PermissionDenied if a user attempts to edit a read-only field for the current stage.
        """
        if not user:
            return

        # Superadmins and Admins have full access and override permission restrictions
        if user.role in ['SUPERADMIN', 'ADMIN']:
            return

        current_status = enquiry.status

        # 1. Pending with Engineering
        # Engineering: Edit (RFQ_TRACKER, SALES_REP) | Costing: Read Only | Sales: Read Only
        if current_status == 'Pending with Engg':
            # Only RFQ_TRACKER and SALES_REP can edit engineering fields
            if user.role not in ['RFQ_TRACKER', 'SALES_REP']:
                cls.check_modified_fields(validated_data, enquiry, cls.ENGINEERING_FIELDS, "Engineering fields are read-only for your role in this stage.")
            # Costing & Sales fields are strictly read-only for all non-admins in this stage
            cls.check_modified_fields(validated_data, enquiry, cls.COSTING_FIELDS, "Costing fields are read-only in this stage.")
            cls.check_modified_fields(validated_data, enquiry, cls.SALES_FIELDS, "Sales fields are read-only in this stage.")

        # 2. Pending with Costing
        # Engineering: Read Only | Costing: Edit (RFQ_TRACKER) | Sales: Read Only
        elif current_status == 'Pending with Costing':
            # Engineering fields are read-only
            cls.check_modified_fields(validated_data, enquiry, cls.ENGINEERING_FIELDS, "Engineering fields are read-only in this stage.")
            # Only RFQ_TRACKER can edit Costing fields
            if user.role != 'RFQ_TRACKER':
                cls.check_modified_fields(validated_data, enquiry, cls.COSTING_FIELDS, "Costing fields are read-only for your role in this stage.")
            # Sales fields are strictly read-only
            cls.check_modified_fields(validated_data, enquiry, cls.SALES_FIELDS, "Sales fields are read-only in this stage.")

        # 3. Sales to Quote
        # Engineering: Read Only | Costing: Read Only | Sales: Edit (SALES_REP, RFQ_TRACKER)
        elif current_status == 'Sales to Quote':
            # Engineering & Costing fields are read-only
            cls.check_modified_fields(validated_data, enquiry, cls.ENGINEERING_FIELDS, "Engineering fields are read-only in this stage.")
            cls.check_modified_fields(validated_data, enquiry, cls.COSTING_FIELDS, "Costing fields are read-only in this stage.")
            # Sales can be edited by SALES_REP and RFQ_TRACKER
            if user.role not in ['SALES_REP', 'RFQ_TRACKER']:
                cls.check_modified_fields(validated_data, enquiry, cls.SALES_FIELDS, "Sales fields are read-only for your role in this stage.")

        # 4. Pending with Sales & Quote Submitted
        # Engineering: Edit (RFQ_TRACKER, SALES_REP) | Costing: Edit (RFQ_TRACKER, SALES_REP) | Sales: Edit (RFQ_TRACKER, SALES_REP)
        # All info can be edited by RFQ_TRACKER and SALES_REP.
        elif current_status in ['Pending with Sales', 'Quote Submitted']:
            if user.role not in ['RFQ_TRACKER', 'SALES_REP']:
                cls.check_modified_fields(validated_data, enquiry, cls.ENGINEERING_FIELDS | cls.COSTING_FIELDS | cls.SALES_FIELDS, "Only Sales Reps and RFQ Trackers can edit fields in this stage.")

    @staticmethod
    def check_modified_fields(validated_data: dict, enquiry: Enquiry, restricted_fields: set, error_message: str):
        for field in restricted_fields:
            if field in validated_data:
                # Compare value with existing instance
                existing_val = getattr(enquiry, field)
                new_val = validated_data[field]
                if existing_val != new_val:
                    raise PermissionDenied(f"Permission Denied: {error_message} (field: '{field}')")
