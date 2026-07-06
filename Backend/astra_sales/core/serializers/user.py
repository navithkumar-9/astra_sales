from rest_framework import serializers
from core.models.user import User, RoleChoices

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'role', 'is_active', 'date_joined']
        read_only_fields = ['id', 'is_active', 'date_joined']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'password', 'name', 'role']
