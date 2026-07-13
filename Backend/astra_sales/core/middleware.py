import logging
import time

from django.conf import settings
from django.db import connection


logger = logging.getLogger("core.performance")


class ApiPerformanceLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.enabled = settings.DEBUG or getattr(settings, "ENABLE_PERFORMANCE_LOGS", False)

    def __call__(self, request):
        if not self.enabled or not request.path.startswith("/api/"):
            return self.get_response(request)

        start_query_count = len(connection.queries)
        start = time.perf_counter()
        response = self.get_response(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        query_count = len(connection.queries) - start_query_count

        logger.info(
            "api_request method=%s path=%s status=%s duration_ms=%.2f sql_queries=%s",
            request.method,
            request.get_full_path(),
            response.status_code,
            elapsed_ms,
            query_count,
        )
        return response
