from core.models.user import User, RoleChoices
from core.metrics import record_user_operation
from core.policies import UserAuthorizationPolicy

class UserService:
    policy = UserAuthorizationPolicy()

    @classmethod
    def create_user(cls, creator, username, password, role, name=""):
        try:
            cls.policy.assert_can_create(creator, role)
            cls._assert_username_available(username)

            user = User.objects.create_user(
                username=username,
                password=password,
                role=role,
                name=name,
            )
            record_user_operation("create", True)
            return user
        except Exception:
            record_user_operation("create", False)
            raise

    @classmethod
    def list_users(cls, requestor, search=None, role=None, is_active=None):
        cls.policy.assert_can_list(requestor)

        if requestor.role not in (RoleChoices.SUPERADMIN, RoleChoices.ADMIN):
            role = RoleChoices.SALES_REP

        if requestor.role == RoleChoices.SUPERADMIN:
            queryset = User.objects.all().order_by("-date_joined")
        elif requestor.role == RoleChoices.ADMIN:
            queryset = User.objects.exclude(role=RoleChoices.SUPERADMIN).order_by("-date_joined")
        else:
            queryset = User.objects.filter(role=RoleChoices.SALES_REP).order_by("-date_joined")

        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(username__icontains=search) | 
                Q(name__icontains=search)
            )

        if role:
            queryset = queryset.filter(role=role)

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)

        return queryset

    @classmethod
    def update_user(cls, requestor, user_id, data):
        try:
            target_user = cls._get_user(user_id)
            cls.policy.assert_can_update(requestor, target_user, data)
            cls._apply_updates(target_user, data)
            target_user.save()
            record_user_operation("update", True)
            return target_user
        except Exception:
            record_user_operation("update", False)
            raise

    @classmethod
    def delete_user(cls, requestor, user_id):
        try:
            target_user = cls._get_user(user_id)
            cls.policy.assert_can_delete(requestor, target_user)
            target_user.delete()
            record_user_operation("delete", True)
            return True
        except Exception:
            record_user_operation("delete", False)
            raise

    @staticmethod
    def _get_user(user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise ValueError("User does not exist.")

    @staticmethod
    def _assert_username_available(username, user_id=None):
        query = User.objects.filter(username=username)
        if user_id is not None:
            query = query.exclude(pk=user_id)
        if query.exists():
            raise ValueError("User with this username already exists.")

    @classmethod
    def _apply_updates(cls, target_user, data):
        if "username" in data:
            cls._assert_username_available(data["username"], target_user.pk)
            target_user.username = data["username"]

        if "name" in data:
            target_user.name = data["name"]

        if "role" in data:
            target_user.role = data["role"]

        if "is_active" in data:
            target_user.is_active = data["is_active"]

        if data.get("password"):
            target_user.set_password(data["password"])
