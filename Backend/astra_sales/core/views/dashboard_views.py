from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from core.models.user import RoleChoices
from core.services.cache_service import CacheService
from core.services.dashboard_service import DashboardService


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Cache-Aside Pattern
        data = CacheService.get_dashboard_stats()
        if not data:
            data = DashboardService.calculate_stats()
            CacheService.set_dashboard_stats(data)

        return Response({"success": True, "data": data})


class SalesRepPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    allowed_roles = {
        RoleChoices.SUPERADMIN,
        RoleChoices.ADMIN,
        RoleChoices.RFQ_TRACKER,
    }

    def get(self, request):
        if request.user.role not in self.allowed_roles:
            return Response(
                {
                    "success": False,
                    "error": "You do not have permission to view sales representative performance.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {
                "success": True,
                "data": DashboardService.calculate_sales_rep_performance(),
            }
        )
