from django.core.exceptions import PermissionDenied

from core.models.user import RoleChoices


class UserAuthorizationPolicy:
    manageable_roles_by_creator = {
        RoleChoices.SUPERADMIN: (
            RoleChoices.ADMIN,
            RoleChoices.RFQ_TRACKER,
            RoleChoices.SALES_REP,
        ),
        RoleChoices.ADMIN: (
            RoleChoices.RFQ_TRACKER,
            RoleChoices.SALES_REP,
        ),
    }

    def assert_can_create(self, creator, role):
        allowed_roles = self.manageable_roles_by_creator.get(creator.role)
        if not allowed_roles:
            raise PermissionDenied("You do not have permission to create users.")

        if role not in allowed_roles:
            allowed_label = " or ".join(role.label for role in allowed_roles)
            raise PermissionDenied(f"{creator.role.title()} can only create {allowed_label}.")

    def assert_can_list(self, requestor):
        if requestor.role not in (RoleChoices.SUPERADMIN, RoleChoices.ADMIN):
            raise PermissionDenied("You do not have permission to list users.")

    def assert_can_update(self, requestor, target_user, data):
        if requestor.role == RoleChoices.SUPERADMIN:
            if target_user.role == RoleChoices.SUPERADMIN and requestor.pk != target_user.pk:
                raise PermissionDenied("You cannot update another Superadmin.")
            return

        if requestor.role == RoleChoices.ADMIN:
            self._assert_admin_can_update(requestor, target_user, data)
            return

        raise PermissionDenied("You do not have permission to update users.")

    def assert_can_delete(self, requestor, target_user):
        if requestor.pk == target_user.pk:
            raise ValueError("You cannot delete yourself.")

        if requestor.role == RoleChoices.SUPERADMIN:
            return

        if requestor.role == RoleChoices.ADMIN:
            if target_user.role in (RoleChoices.RFQ_TRACKER, RoleChoices.SALES_REP):
                return
            raise PermissionDenied("Admin can only delete RFQ Trackers or Sales Reps.")

        raise PermissionDenied("You do not have permission to delete users.")

    def _assert_admin_can_update(self, requestor, target_user, data):
        requested_role = data.get("role")

        if target_user.pk == requestor.pk:
            if requested_role == RoleChoices.SUPERADMIN:
                raise PermissionDenied("You cannot elevate yourself to Superadmin.")
            return

        if target_user.role not in (RoleChoices.RFQ_TRACKER, RoleChoices.SALES_REP):
            raise PermissionDenied("Admin can only manage RFQ Trackers or Sales Reps.")

        if requested_role in (RoleChoices.SUPERADMIN, RoleChoices.ADMIN):
            raise PermissionDenied("You cannot elevate users above your role.")
