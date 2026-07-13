from rest_framework import viewsets, permissions
from core.models.activity import Activity
from core.serializers.activity import ActivitySerializer
from core.permissions import IsActivityOwnerOrAdmin

class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated, IsActivityOwnerOrAdmin]

    def get_queryset(self):
        return Activity.objects.select_related('user', 'enquiry').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
