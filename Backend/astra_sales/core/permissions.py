from rest_framework import permissions
from core.models.user import RoleChoices

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow Superadmins or Admins to edit/delete master data,
    but allow authenticated users to view it.
    """
    def has_permission(self, request, view):
        # Allow read-only operations for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Allow write operations (POST, PUT, PATCH, DELETE) only for ADMIN/SUPERADMIN
        return request.user and request.user.is_authenticated and request.user.role in (RoleChoices.SUPERADMIN, RoleChoices.ADMIN)
