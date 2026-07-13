from rest_framework import serializers
from core.models.activity import Activity
from core.serializers.user import UserSerializer

class ActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = ['id', 'enquiry', 'user', 'activity_type', 'description', 'created_at']
        read_only_fields = ['user', 'created_at']
