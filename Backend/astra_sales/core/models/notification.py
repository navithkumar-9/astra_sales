from django.db import models
from core.models.base import TimeStampedModel
from core.models.user import User

class Notification(TimeStampedModel):
    """
    Model to store system and user notifications.
    Follows Single Responsibility Principle (SRP).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=50, default='INFO')

    class Meta:
        db_table = 'user_notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:30]}"
