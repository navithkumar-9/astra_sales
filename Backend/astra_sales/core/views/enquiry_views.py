from rest_framework import permissions
from rest_framework.response import Response
from core.views.master_data_views import BaseModelViewSet
from core.models.enquiry import Enquiry
from core.serializers.enquiry import EnquirySerializer, EnquiryListSerializer, EnquiryReadSerializer
from core.permissions import CanEditEnquiry
from core.services.cache_service import CacheService
from core.services.enquiry_service import refresh_enquiry_caches_after_commit

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
        queryset = (
            Enquiry.objects
            .select_related(*ENQUIRY_SELECT_RELATED)
            .order_by('-created_at')
        )
        if self.action == 'list':
            return queryset.prefetch_related('fg_details')
        return queryset.prefetch_related(
            'fg_details',
            'audit_logs',
            'audit_logs__user',
            'activities',
            'activities__user',
        )

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        status = self.request.query_params.get('status', '').strip()
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return EnquiryListSerializer
        if self.action == 'retrieve':
            return EnquiryReadSerializer
        return EnquirySerializer

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()
        refresh_enquiry_caches_after_commit()

    def list(self, request, *args, **kwargs):
        # Cache-Aside Pattern
        cache_key = CacheService.make_enquiries_key(request.query_params)
        cached_data = CacheService.get_enquiries(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            # Fetch default paginated response
            response = self.get_paginated_response(serializer.data)
            CacheService.set_enquiries(cache_key, response.data)
            return response

        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data
        CacheService.set_enquiries(cache_key, response_data)
        return Response(response_data)
