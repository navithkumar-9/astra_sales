from rest_framework import permissions
from core.views.master_data_views import BaseModelViewSet
from core.models.enquiry import Enquiry
from core.serializers.enquiry import EnquirySerializer, EnquiryReadSerializer
from core.permissions import CanEditEnquiry

ENQUIRY_SELECT_RELATED = (
    'customer',
    'sbu',
    'division',
    'rfq_type',
    'fg_type',
    'sales_rep',
)


class EnquiryViewSet(BaseModelViewSet):
    queryset = Enquiry.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated, CanEditEnquiry]
    search_fields = ['project_number', 'project_name', 'rfq_no']

    def get_queryset(self):
        return (
            Enquiry.objects
            .select_related(*ENQUIRY_SELECT_RELATED)
            .prefetch_related('fg_details', 'audit_logs', 'audit_logs__user', 'activities', 'activities__user')
            .order_by('-created_at')
        )

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        status = self.request.query_params.get('status', '').strip()
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return EnquiryReadSerializer
        return EnquirySerializer
