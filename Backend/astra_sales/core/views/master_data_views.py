from rest_framework import viewsets
from rest_framework import status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import ProtectedError
from core.permissions import IsAdminOrReadOnly
from core.services.enquiry_service import refresh_enquiry_caches_after_commit

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


class BaseModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    ordering = ["-created_at"]
    ordering_fields = ["id", "created_at", "updated_at"]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
        except ProtectedError:
            return Response(
                {
                    "success": False,
                    "error": "This record is in use and cannot be deleted.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        serializer.save()
        refresh_enquiry_caches_after_commit()

    def perform_update(self, serializer):
        serializer.save()
        refresh_enquiry_caches_after_commit()

    def perform_destroy(self, instance):
        instance.delete()
        refresh_enquiry_caches_after_commit()


class SBUViewSet(BaseModelViewSet):
    queryset = SBU.objects.all()
    serializer_class = SBUSerializer
    search_fields = ["name"]
    ordering_fields = BaseModelViewSet.ordering_fields + ["name"]


class DivisionViewSet(BaseModelViewSet):
    queryset = Division.objects.all()
    serializer_class = DivisionSerializer
    search_fields = ["name"]
    ordering_fields = BaseModelViewSet.ordering_fields + ["name"]


class FGViewSet(BaseModelViewSet):
    queryset = FG.objects.all()
    serializer_class = FGSerializer
    search_fields = ["fg_type"]
    ordering_fields = BaseModelViewSet.ordering_fields + ["fg_type"]


class RFQViewSet(BaseModelViewSet):
    queryset = RFQ.objects.all()
    serializer_class = RFQSerializer
    search_fields = ["name"]
    ordering_fields = BaseModelViewSet.ordering_fields + ["name"]


class CustomerViewSet(BaseModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    search_fields = ["name"]
    ordering_fields = BaseModelViewSet.ordering_fields + ["name"]


from rest_framework.decorators import action
from django.core.cache import cache
from core.tasks.mail_tasks import (
    send_mail_all_task,
    MAIL_COOLDOWN_CACHE_KEY,
    MAIL_COOLDOWN_SECONDS,
)


class MailViewSet(BaseModelViewSet):
    queryset = Mail.objects.all()
    serializer_class = MailSerializer
    search_fields = ["email"]
    ordering_fields = BaseModelViewSet.ordering_fields + ["email"]

    def get_permissions(self):
        if self.action == "mail_all":
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["post"], url_path="mail-all")
    def mail_all(self, request):
        """
        Triggers an asynchronous task to send CRM pipeline report to all registered email addresses.
        Only accessible by SUPERADMIN, ADMIN, or RFQ_TRACKER.
        Includes 60-second cooldown to prevent duplicate sends (Bug #6 fix).
        """
        from core.models.user import RoleChoices

        if request.user.role not in (
            RoleChoices.SUPERADMIN,
            RoleChoices.ADMIN,
            RoleChoices.RFQ_TRACKER,
        ):
            return Response(
                {
                    "success": False,
                    "error": "You do not have permission to trigger this action.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Idempotency / cooldown check (Bug #6 fix)
        if cache.get(MAIL_COOLDOWN_CACHE_KEY):
            return Response(
                {
                    "success": False,
                    "error": "A mail report was recently triggered. Please wait 60 seconds before trying again.",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Set cooldown lock
        cache.set(MAIL_COOLDOWN_CACHE_KEY, True, timeout=MAIL_COOLDOWN_SECONDS)

        # Pass user ID so EmailLog can track who triggered
        send_mail_all_task.delay(triggered_by_id=request.user.id)

        return Response(
            {
                "success": True,
                "message": "Mail report successfully triggered in the background.",
            },
            status=status.HTTP_202_ACCEPTED,
        )
