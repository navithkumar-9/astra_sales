from rest_framework import permissions
from core.views.master_data_views import BaseModelViewSet
from core.models.enquiry import Enquiry
from core.serializers.enquiry import EnquirySerializer, EnquiryReadSerializer

class EnquiryViewSet(BaseModelViewSet):
    queryset = Enquiry.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['project_number', 'project_name', 'rfq_no']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return EnquiryReadSerializer
        return EnquirySerializer
