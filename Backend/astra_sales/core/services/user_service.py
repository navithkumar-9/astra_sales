from core.models.user import User, RoleChoices
from django.core.exceptions import PermissionDenied

class UserService:
    @staticmethod
    def create_user(creator, username, password, role, name=""):
        """
        Hierarchy Rules:
        - SUPERADMIN can only create ADMIN
        - ADMIN can only create RFQ_TRACKER
        - RFQ_TRACKER cannot create anyone
        """
        if creator.role == RoleChoices.SUPERADMIN:
            if role != RoleChoices.ADMIN:
                raise PermissionDenied("Superadmin can only create Admins.")
        elif creator.role == RoleChoices.ADMIN:
            if role != RoleChoices.RFQ_TRACKER:
                raise PermissionDenied("Admin can only create RFQ Trackers.")
        else:
            raise PermissionDenied("You do not have permission to create users.")
            
        if User.objects.filter(username=username).exists():
            raise ValueError("User with this username already exists.")

        user = User.objects.create_user(
            username=username,
            password=password,
            role=role,
            name=name
        )
        return user
