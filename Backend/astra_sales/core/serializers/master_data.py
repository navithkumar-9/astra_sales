from rest_framework import serializers
from core.models.sbu import SBU
from core.models.division import Division
from core.models.fg import FG
from core.models.rfq import RFQ
from core.models.customer import Customer
from core.models.mail import Mail

class SBUSerializer(serializers.ModelSerializer):
    class Meta:
        model = SBU
        fields = ['id', 'name', 'created_at', 'updated_at']

class DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ['id', 'name', 'created_at', 'updated_at']

class FGSerializer(serializers.ModelSerializer):
    class Meta:
        model = FG
        fields = ['id', 'fg_type', 'created_at', 'updated_at']

class RFQSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFQ
        fields = ['id', 'name', 'created_at', 'updated_at']

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'created_at', 'updated_at']

class MailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mail
        fields = ['id', 'email', 'created_at', 'updated_at']
