from rest_framework import viewsets
from rest_framework import status
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


class DivisionViewSet(BaseModelViewSet):
    queryset = Division.objects.all()
    serializer_class = DivisionSerializer


class FGViewSet(BaseModelViewSet):
    queryset = FG.objects.all()
    serializer_class = FGSerializer


class RFQViewSet(BaseModelViewSet):
    queryset = RFQ.objects.all()
    serializer_class = RFQSerializer


class CustomerViewSet(BaseModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


from rest_framework.decorators import action
from core.tasks.mail_tasks import send_mail_all_task

class MailViewSet(BaseModelViewSet):
    queryset = Mail.objects.all()
    serializer_class = MailSerializer

    @action(detail=False, methods=['post'], url_path='mail-all')
    def mail_all(self, request):
        """
        Triggers an asynchronous task to send CRM pipeline report to all registered email addresses.
        """
        send_mail_all_task.delay()
        return Response({
            "success": True,
            "message": "Mail report successfully triggered in the background."
        }, status=status.HTTP_202_ACCEPTED)

