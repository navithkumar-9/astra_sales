import hashlib
from django.core.cache import cache


class CacheService:
    DASHBOARD_CACHE_KEY = "dashboard_stats_data"
    ENQUIRIES_CACHE_PREFIX = "enquiries_list"

    @staticmethod
    def get_dashboard_stats():
        """Retrieve dashboard stats from cache."""
        return cache.get(CacheService.DASHBOARD_CACHE_KEY)

    @staticmethod
    def set_dashboard_stats(data, timeout=86400):
        """Set dashboard stats in cache."""
        cache.set(CacheService.DASHBOARD_CACHE_KEY, data, timeout=timeout)

    @staticmethod
    def make_enquiries_key(query_params):
        """Generate a deterministic cache key based on sorted query parameters."""
        # Convert QueryDict to a standard dict and convert list values to tuples
        params_dict = {}
        for key in query_params:
            val = query_params.getlist(key)
            params_dict[key] = tuple(sorted(val)) if len(val) > 1 else val[0]
            
        sorted_items = sorted(params_dict.items())
        params_str = str(sorted_items)
        params_hash = hashlib.md5(params_str.encode('utf-8')).hexdigest()
        return f"{CacheService.ENQUIRIES_CACHE_PREFIX}:{params_hash}"

    @staticmethod
    def get_enquiries(key):
        """Retrieve enquiries list from cache."""
        return cache.get(key)

    @staticmethod
    def set_enquiries(key, data, timeout=3600):
        """Set enquiries list in cache."""
        cache.set(key, data, timeout=timeout)

    @staticmethod
    def invalidate_all_enquiries():
        """Invalidate all cached enquiry lists."""
        if hasattr(cache, "delete_pattern"):
            cache.delete_pattern(f"{CacheService.ENQUIRIES_CACHE_PREFIX}:*")
        else:
            # Fallback if cache backend doesn't support delete_pattern (e.g. dummy cache)
            pass

    @staticmethod
    def invalidate_dashboard():
        """Invalidate dashboard cache."""
        cache.delete(CacheService.DASHBOARD_CACHE_KEY)

    @staticmethod
    def invalidate_enquiry_dependencies():
        """Invalidate caches whose data can change when enquiry-related records change."""
        CacheService.invalidate_dashboard()
        CacheService.invalidate_all_enquiries()

    @staticmethod
    def refresh_enquiry_dependencies_async():
        """Refresh common enquiry/dashboard caches in the background after invalidation."""
        from core.tasks.cache_tasks import refresh_all_caches

        refresh_all_caches.delay()
