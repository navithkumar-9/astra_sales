from rest_framework import permissions, filters
from rest_framework.response import Response
from core.views.master_data_views import BaseModelViewSet
from core.models.enquiry import Enquiry
from core.serializers.enquiry import (
    EnquirySerializer,
    EnquiryListSerializer,
    EnquiryReadSerializer,
)
from core.permissions import CanEditEnquiry
from core.services.cache_service import CacheService
from core.services.enquiry_service import refresh_enquiry_caches_after_commit

ENQUIRY_SELECT_RELATED = (
    "customer",
    "sbu",
    "division",
    "rfq_type",
    "fg_type",
    "sales_rep",
)


class EnquiryViewSet(BaseModelViewSet):
    queryset = Enquiry.objects.all().order_by("-created_at")
    permission_classes = [permissions.IsAuthenticated, CanEditEnquiry]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["project_number", "project_name", "rfq_no"]
    ordering_fields = [
        "project_number",
        "rfq_date",
        "rfq_no",
        "customer__name",
        "division__name",
        "ed_of_engg",
        "ed_of_costing",
        "ed_of_sales",
        "status",
        "enquiry_aging",
        "quote_submission_aging",
        "created_at",
    ]

    def get_queryset(self):
        queryset = Enquiry.objects.select_related(*ENQUIRY_SELECT_RELATED).order_by(
            "-created_at"
        )
        if self.action == "list":
            return queryset.prefetch_related("fg_details")
        return queryset.prefetch_related(
            "fg_details",
            "audit_logs",
            "audit_logs__user",
            "activities",
            "activities__user",
        )

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        params = self.request.query_params

        # Exact and contains filters
        status = params.get("status", "").strip()
        if status:
            queryset = queryset.filter(status=status)

        rfq_no = params.get("rfq_no", "").strip()
        if rfq_no:
            queryset = queryset.filter(rfq_no__icontains=rfq_no)

        project_name = params.get("project_name", "").strip()
        if project_name:
            queryset = queryset.filter(project_name__icontains=project_name)

        # Foreign Key exact matches
        for fk_field in ["customer", "sales_rep", "division", "sbu"]:
            val = params.get(fk_field, "").strip()
            if val and val.isdigit():
                queryset = queryset.filter(**{f"{fk_field}_id": int(val)})

        rfq_type = params.get("rfq_type", "").strip()
        if rfq_type:
            if rfq_type.isdigit():
                queryset = queryset.filter(rfq_type_id=int(rfq_type))
            else:
                queryset = queryset.filter(rfq_type__name__icontains=rfq_type)

        rfq_due_date = params.get("rfq_due_date", "").strip()
        if rfq_due_date:
            queryset = queryset.filter(rfq_due_date=rfq_due_date)

        # Date Range filters
        rfq_date_from = params.get("rfq_date_from", "").strip()
        if rfq_date_from:
            queryset = queryset.filter(rfq_date__gte=rfq_date_from)

        rfq_date_to = params.get("rfq_date_to", "").strip()
        if rfq_date_to:
            queryset = queryset.filter(rfq_date__lte=rfq_date_to)

        # Aging Range filters
        aging_type = params.get(
            "aging_type", "enquiry_aging"
        ).strip()  # 'enquiry_aging' or 'quote_submission_aging'
        if aging_type in ["enquiry_aging", "quote_submission_aging"]:
            aging_min = params.get("aging_min", "").strip()
            if aging_min and aging_min.isdigit():
                queryset = queryset.filter(**{f"{aging_type}__gte": int(aging_min)})

            aging_max = params.get("aging_max", "").strip()
            if aging_max and aging_max.isdigit():
                queryset = queryset.filter(**{f"{aging_type}__lte": int(aging_max)})

        quoted_over_90 = params.get("quoted_over_90", "").strip()
        if quoted_over_90.lower() == "true":
            from django.utils import timezone
            from datetime import timedelta

            date_90_days_ago = timezone.now().date() - timedelta(days=90)
            queryset = queryset.filter(
                status="Quote Submitted", quote_date__lt=date_90_days_ago
            )

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return EnquiryListSerializer
        if self.action == "retrieve":
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
