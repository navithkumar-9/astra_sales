from abc import ABC, abstractmethod
from core.models.user import User

class BaseNotificationService(ABC):
    """
    Abstract interface for notifying users.
    Follows Dependency Inversion Principle (DIP) and Open/Closed Principle (OCP).
    """

    @abstractmethod
    def notify_success(self, user: User, message: str, file_url: str) -> None:
        """Send a success notification to the user."""
        pass

    @abstractmethod
    def notify_failure(self, user: User, message: str, error_details: str) -> None:
        """Send a failure notification to the user."""
        pass
