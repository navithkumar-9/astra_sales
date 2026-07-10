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
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        return EnquiryService.create_enquiry(validated_data)

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
            'audit_logs',
            'activities',
            'created_at',
            'updated_at',
        ]
