from rest_framework import serializers
from core.models.audit import EnquiryAuditLog
from core.serializers.user import UserSerializer

class EnquiryAuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = EnquiryAuditLog
        fields = ['id', 'user', 'field_name', 'old_value', 'new_value', 'created_at']
