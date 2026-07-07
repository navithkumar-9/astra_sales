from rest_framework import viewsets, permissions, status
from core.models.sbu import SBU
from core.models.division import Division
from core.models.fg import FG
from core.models.rfq import RFQ
from core.models.customer import Customer
from core.models.mail import Mail
from core.serializers.master_data import (
    SBUSerializer,
    DivisionSerializer,
    FGSerializer,
    RFQSerializer,
    CustomerSerializer,
    MailSerializer,
)
from core.permissions import IsAdminOrReadOnly
from core.response import success_response
from core.pagination import CustomPagination

class BaseModelViewSet(viewsets.ModelViewSet):
    """
    Standardized BaseModelViewSet providing success responses for all master data CRUD.
    """
    pagination_class = CustomPagination

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            search_fields = getattr(self, 'search_fields', None)
            if search_fields:
                from django.db.models import Q
                q_objects = Q()
                for field in search_fields:
                    q_objects |= Q(**{f"{field}__icontains": search_query})
                queryset = queryset.filter(q_objects)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data, message="List retrieved successfully.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data, message="Detail retrieved successfully.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        model_name = self.queryset.model.__name__
        return success_response(
            data=serializer.data,
            message=f"{model_name} created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        model_name = self.queryset.model.__name__
        return success_response(
            data=serializer.data,
            message=f"{model_name} updated successfully."
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        model_name = self.queryset.model.__name__
        return success_response(
            message=f"{model_name} deleted successfully."
        )


class SBUViewSet(BaseModelViewSet):
    queryset = SBU.objects.all().order_by('-created_at')
    serializer_class = SBUSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ['name']

class DivisionViewSet(BaseModelViewSet):
    queryset = Division.objects.all().order_by('-created_at')
    serializer_class = DivisionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ['name']

class FGViewSet(BaseModelViewSet):
    queryset = FG.objects.all().order_by('-created_at')
    serializer_class = FGSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ['fg_type']

class RFQViewSet(BaseModelViewSet):
    queryset = RFQ.objects.all().order_by('-created_at')
    serializer_class = RFQSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ['name']

class CustomerViewSet(BaseModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ['name']

class MailViewSet(BaseModelViewSet):
    queryset = Mail.objects.all().order_by('-created_at')
    serializer_class = MailSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ['email']
