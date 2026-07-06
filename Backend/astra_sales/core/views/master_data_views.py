from rest_framework import viewsets, permissions
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

class SBUViewSet(viewsets.ModelViewSet):
    queryset = SBU.objects.all().order_by('-created_at')
    serializer_class = SBUSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class DivisionViewSet(viewsets.ModelViewSet):
    queryset = Division.objects.all().order_by('-created_at')
    serializer_class = DivisionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class FGViewSet(viewsets.ModelViewSet):
    queryset = FG.objects.all().order_by('-created_at')
    serializer_class = FGSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class RFQViewSet(viewsets.ModelViewSet):
    queryset = RFQ.objects.all().order_by('-created_at')
    serializer_class = RFQSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

class MailViewSet(viewsets.ModelViewSet):
    queryset = Mail.objects.all().order_by('-created_at')
    serializer_class = MailSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
