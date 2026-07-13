from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
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

        return Response({
            "success": True,
            "data": data
        })
