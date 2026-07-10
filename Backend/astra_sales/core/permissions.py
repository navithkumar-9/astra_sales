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

class CanEditEnquiry(permissions.BasePermission):
    """
    Custom permission for object-level Enquiry editing.
    Sales Reps can only edit enquiries assigned to them.
    Other roles (SUPERADMIN, ADMIN, RFQ_TRACKER) can edit all.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user (or restricted at queryset level)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions
        if request.user.role in [RoleChoices.SUPERADMIN, RoleChoices.ADMIN, RoleChoices.RFQ_TRACKER]:
            return True
            
        if request.user.role == RoleChoices.SALES_REP:
            return obj.sales_rep == request.user
            
        return False
