from rest_framework import serializers
from core.models.enquiry import Enquiry, EnquiryFGDetail
from core.serializers.user import UserSerializer
from core.serializers.master_data import (
    SBUSerializer,
    DivisionSerializer,
    FGSerializer,
    RFQSerializer,
    CustomerSerializer,
)

class EnquiryFGDetailSerializer(serializers.ModelSerializer):
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
            'rfq_aging',
            'created_at',
            'updated_at',
        ]

    def create(self, validated_data):
        fg_details_data = validated_data.pop('fg_details', [])
        enquiry = Enquiry.objects.create(**validated_data)
        for detail_data in fg_details_data:
            EnquiryFGDetail.objects.create(enquiry=enquiry, **detail_data)
        return enquiry

    def update(self, instance, validated_data):
        fg_details_data = validated_data.pop('fg_details', None)
        
        # Update Enquiry fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update FG details if provided
        if fg_details_data is not None:
            # Delete old details and recreate
            instance.fg_details.all().delete()
            for detail_data in fg_details_data:
                EnquiryFGDetail.objects.create(enquiry=instance, **detail_data)

        return instance


class EnquiryReadSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    sbu = SBUSerializer(read_only=True)
    division = DivisionSerializer(read_only=True)
    rfq_type = RFQSerializer(read_only=True)
    fg_type = FGSerializer(read_only=True)
    sales_rep = UserSerializer(read_only=True)
    fg_details = EnquiryFGDetailSerializer(many=True, read_only=True)
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
            'rfq_aging',
            'created_at',
            'updated_at',
        ]
