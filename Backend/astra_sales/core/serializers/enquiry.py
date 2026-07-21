from rest_framework import serializers
from core.models.enquiry import Enquiry, EnquiryFGDetail
from core.services.enquiry_service import EnquiryService
from core.serializers.user import UserSerializer
from core.serializers.audit import EnquiryAuditLogSerializer
from core.serializers.activity import ActivitySerializer
from core.serializers.master_data import (
    SBUSerializer,
    DivisionSerializer,
    FGSerializer,
    RFQSerializer,
    CustomerSerializer,
)

class EnquiryFGDetailSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = EnquiryFGDetail
        fields = ['id', 'fg_part_no', 'description', 'qty']


class EnquirySerializer(serializers.ModelSerializer):
    fg_details = EnquiryFGDetailSerializer(many=True)
    rfq_aging = serializers.ReadOnlyField()

    def to_internal_value(self, data):
        # Prevent mutating the argument directly if it is a QueryDict or dict
        if hasattr(data, 'copy'):
            data = data.copy()
        elif isinstance(data, dict):
            data = dict(data)

        # Handle multipart/form-data passing nested JSON strings
        if 'fg_details' in data and isinstance(data.get('fg_details'), str):
            import json
            try:
                # Convert QueryDict to standard dict to bypass DRF's html.parse_html_list
                if hasattr(data, 'lists'):
                    mutable_data = {k: v[0] if len(v) == 1 else v for k, v in data.lists()}
                else:
                    mutable_data = dict(data)
                mutable_data['fg_details'] = json.loads(data.get('fg_details'))
                data = mutable_data
            except Exception:
                pass

        # Handle string URLs for file fields to prevent "The submitted data was not a file" validation error
        for field in ['rfq_document', 'po_document']:
            if field in data and isinstance(data[field], str):
                val = data[field]
                if val.startswith('http') or '/media/' in val or (self.instance and getattr(self.instance, field) and val.endswith(getattr(self.instance, field).name)):
                    data.pop(field, None)

        return super().to_internal_value(data)

    class Meta:
        model = Enquiry
        fields = [
            'id',
            'project_number',
            'rfq_date',
            'rfq_no',
            'customer',
            'sbu',
            'project_name',
            'division',
            'rfq_due_date',
            'rfq_due_time',
            'rfq_assign_date',
            'rfq_type',
            'fg_type',
            'sales_rep',
            'fg_details',
            'ed_of_engg',
            'actual_date_of_engg',
            'engg_remarks',
            'ed_of_costing',
            'actual_date_of_costing',
            'costing_remarks',
            'ed_of_sales',
            'actual_date_of_sales',
            'sales_remarks',
            'status',
            'clarification_to_cs',
            'clarification_from_cs',
            'remarks',
            'quote_date',
            'quote_value',
            'open_l1_value',
            'open_l1_date',
            'lost_value',
            'po_no',
            'po_receipt_date',
            'po_value',
            'rfq_document',
            'po_document',
            'rfq_aging',
            'enquiry_aging',
            'quote_submission_aging',
            'created_at',
            'updated_at',
        ]

    def validate(self, data):
        from django.utils import timezone
        today = timezone.now().date()
        
        expected_date_fields = ['ed_of_engg', 'ed_of_costing', 'ed_of_sales']
        for field in expected_date_fields:
            if field in data and data[field]:
                # Skip validation if we are updating and the date hasn't changed
                if self.instance and getattr(self.instance, field) == data[field]:
                    continue
                if data[field] < today:
                    raise serializers.ValidationError({
                        field: "Expected date cannot be in the past."
                    })

        # Strict business rule: RFQ and PO documents can only be uploaded, edited or deleted in "Won" status
        has_rfq_doc = 'rfq_document' in data
        has_po_doc = 'po_document' in data
        
        if has_rfq_doc or has_po_doc:
            status_after_update = data.get('status', self.instance.status if self.instance else 'Pending with Engg')
            if status_after_update != 'Won':
                modified_fields = []
                if has_rfq_doc:
                    existing_rfq = getattr(self.instance, 'rfq_document') if self.instance else None
                    new_rfq = data.get('rfq_document')
                    if existing_rfq != new_rfq:
                        modified_fields.append('rfq_document')
                if has_po_doc:
                    existing_po = getattr(self.instance, 'po_document') if self.instance else None
                    new_po = data.get('po_document')
                    if existing_po != new_po:
                        modified_fields.append('po_document')
                
                if modified_fields:
                    errors = {
                        f: "RFQ and PO documents can only be uploaded after the RFQ status is marked as Won."
                        for f in modified_fields
                    }
                    raise serializers.ValidationError(errors)

        return data

    def create(self, validated_data):
        user = self.context.get('request').user if self.context.get('request') else None
        return EnquiryService.create_enquiry(validated_data, user)

    def update(self, instance, validated_data):
        user = self.context.get('request').user if self.context.get('request') else None
        return EnquiryService.update_enquiry(instance, validated_data, user)


class EnquiryReadSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    sbu = SBUSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    rfq_type = RFQSerializer(read_only=True)
    fg_type = FGSerializer(read_only=True)
    sales_rep = UserSerializer(read_only=True)
    fg_details = EnquiryFGDetailSerializer(many=True, read_only=True)
    audit_logs = EnquiryAuditLogSerializer(many=True, read_only=True)
    activities = ActivitySerializer(many=True, read_only=True)
    rfq_aging = serializers.ReadOnlyField()

    class Meta:
        model = Enquiry
        fields = [
            'id',
            'project_number',
            'rfq_date',
            'rfq_no',
            'customer',
            'sbu',
            'project_name',
            'division',
            'rfq_due_date',
            'rfq_due_time',
            'rfq_assign_date',
            'rfq_type',
            'fg_type',
            'sales_rep',
            'fg_details',
            'ed_of_engg',
            'actual_date_of_engg',
            'engg_remarks',
            'ed_of_costing',
            'actual_date_of_costing',
            'costing_remarks',
            'ed_of_sales',
            'actual_date_of_sales',
            'sales_remarks',
            'status',
            'clarification_to_cs',
            'clarification_from_cs',
            'remarks',
            'quote_date',
            'quote_value',
            'open_l1_value',
            'open_l1_date',
            'lost_value',
            'po_no',
            'po_receipt_date',
            'po_value',
            'rfq_document',
            'po_document',
            'rfq_aging',
            'enquiry_aging',
            'quote_submission_aging',
            'audit_logs',
            'activities',
            'created_at',
            'updated_at',
        ]


class EnquiryListSerializer(EnquiryReadSerializer):
    class Meta(EnquiryReadSerializer.Meta):
        fields = [
            field for field in EnquiryReadSerializer.Meta.fields
            if field not in ('audit_logs', 'activities')
        ]
