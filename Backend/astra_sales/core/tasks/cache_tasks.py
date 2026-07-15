from celery import shared_task
from django.http import QueryDict
import logging
from core.services.cache_service import CacheService
from core.services.dashboard_service import DashboardService
from core.models.enquiry import Enquiry
from core.serializers.enquiry import EnquiryListSerializer

logger = logging.getLogger(__name__)

@shared_task
def refresh_dashboard_cache():
    """Background task to recalculate and refresh dashboard stats cache."""
    try:
        data = DashboardService.calculate_stats()
        CacheService.set_dashboard_stats(data)
    except Exception:
        logger.exception("Error refreshing dashboard cache")

@shared_task
def refresh_enquiries_cache():
    """Background task to invalidate and refresh common enquiries list caches."""
    try:
        # Step 1: Invalidate existing list caches
        CacheService.invalidate_all_enquiries()

        # Step 2: Pre-populate the Kanban board list (page_size=1000)
        qd_kanban = QueryDict('page_size=1000')
        key_kanban = CacheService.make_enquiries_key(qd_kanban)
        
        from core.views.enquiry_views import ENQUIRY_SELECT_RELATED
        qs = Enquiry.objects.select_related(*ENQUIRY_SELECT_RELATED).prefetch_related(
            'fg_details'
        ).order_by('-created_at')
        
        count = qs.count()
        results = EnquiryListSerializer(qs[:1000], many=True).data
        data_kanban = {
            "isV1": True,
            "success": True,
            "message": "Paginated list retrieved successfully.",
            "data": {
                "count": count,
                "next": None,
                "previous": None,
                "results": results,
            },
        }
        CacheService.set_enquiries(key_kanban, data_kanban)
    except Exception:
        logger.exception("Error refreshing enquiries cache")

@shared_task
def refresh_all_caches():
    """Refresh both dashboard and enquiries caches in the background."""
    refresh_dashboard_cache()
    refresh_enquiries_cache()
