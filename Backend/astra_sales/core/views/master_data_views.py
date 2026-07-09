from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

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
    permission_classes = [IsAuthenticated]

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

class MailViewSet(BaseModelViewSet):
    queryset = Mail.objects.all()
    serializer_class = MailSerializer
