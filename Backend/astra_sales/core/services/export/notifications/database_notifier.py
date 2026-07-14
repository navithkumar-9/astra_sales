from core.models.user import User
from core.models.notification import Notification
from core.services.export.notifications.base_notifier import BaseNotificationService

class DatabaseNotificationService(BaseNotificationService):
    """
    Database notification service that creates system-level user notifications.
    Follows Single Responsibility Principle (SRP) and Dependency Inversion Principle (DIP).
    """

    def notify_success(self, user: User, message: str, file_url: str) -> None:
        """Create a successful notification for the user."""
        Notification.objects.create(
            user=user,
            notification_type='SUCCESS',
            message=f"✅ Export completed successfully: {message}. Download link: {file_url}"
        )

    def notify_failure(self, user: User, message: str, error_details: str) -> None:
        """Create a failure notification for the user."""
        Notification.objects.create(
            user=user,
            notification_type='FAILURE',
            message=f"❌ Export failed: {message}. Reason: {error_details}"
        )
