from rest_framework import serializers
from core.models.export_job import ExportJob
from core.serializers.user import UserSerializer

class ExportRequestSerializer(serializers.Serializer):
    format = serializers.ChoiceField(choices=['csv'], default='csv')
    filters = serializers.JSONField(required=False, default=dict)

class ExportJobSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ExportJob
        fields = [
            'id',
            'user',
            'status',
            'progress',
            'file_path',
            'total_records',
            'exported_records',
            'error_message',
            'started_at',
            'completed_at',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'user', 'status', 'progress', 'file_path', 'total_records', 'exported_records', 'error_message', 'started_at', 'completed_at', 'created_at', 'updated_at']
