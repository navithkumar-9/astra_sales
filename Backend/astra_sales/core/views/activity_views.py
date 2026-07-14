from rest_framework import viewsets, permissions
from core.models.activity import Activity
from core.serializers.activity import ActivitySerializer
from core.permissions import IsActivityOwnerOrAdmin
from core.services.enquiry_service import refresh_enquiry_caches_after_commit

class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated, IsActivityOwnerOrAdmin]

    def get_queryset(self):
        return Activity.objects.select_related('user', 'enquiry').order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        refresh_enquiry_caches_after_commit()

    def perform_update(self, serializer):
        serializer.save()
        refresh_enquiry_caches_after_commit()

    def perform_destroy(self, instance):
        instance.delete()
        refresh_enquiry_caches_after_commit()
