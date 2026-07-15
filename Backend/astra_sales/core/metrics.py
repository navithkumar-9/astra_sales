from django.db.models import Count
from prometheus_client import Counter
from prometheus_client.core import GaugeMetricFamily, REGISTRY

from core.models.user import RoleChoices, User

USER_METRICS_CACHE_KEY = "metrics:user_accounts_snapshot"
USER_METRICS_CACHE_TTL = 60


AUTH_LOGIN_ATTEMPTS = Counter(
    "astra_sales_auth_login_attempts_total",
    "Login attempts grouped by result.",
    ("result",),
)

USER_MANAGEMENT_OPERATIONS = Counter(
    "astra_sales_user_management_operations_total",
    "User-management operations grouped by operation and result.",
    ("operation", "result"),
)


class UserAccountsCollector:
    def collect(self):
        metric = GaugeMetricFamily(
            "astra_sales_user_accounts",
            "Current number of user accounts grouped by role and active state.",
            labels=["role", "is_active"],
        )

        import sys
        if any(cmd in sys.argv for cmd in ["migrate", "makemigrations", "check", "collectstatic"]):
            yield metric
            return

        from django.core.cache import cache
        from django.db.utils import OperationalError, ProgrammingError
        
        try:
            snapshot = cache.get(USER_METRICS_CACHE_KEY)
            if snapshot is None:
                snapshot = list(
                    User.objects.values("role", "is_active")
                    .annotate(count=Count("id"))
                    .values_list("role", "is_active", "count")
                )
                cache.set(USER_METRICS_CACHE_KEY, snapshot, USER_METRICS_CACHE_TTL)

            for role, is_active, count in snapshot:
                metric.add_metric(
                    [role, str(is_active).lower()],
                    count,
                )
        except (OperationalError, ProgrammingError, ImportError):
            pass

        yield metric


def record_login_attempt(success):
    AUTH_LOGIN_ATTEMPTS.labels(result="success" if success else "failure").inc()


def record_user_operation(operation, success):
    USER_MANAGEMENT_OPERATIONS.labels(
        operation=operation,
        result="success" if success else "failure",
    ).inc()


def register_collectors():
    if getattr(register_collectors, "_registered", False):
        return

    # PREVENT DEADLOCK: 
    # django-prometheus registers its own metrics when the cache is initialized.
    # If we register our collector first, prometheus_client acquires a lock and calls collect().
    # collect() hits the cache, which triggers django-prometheus to register its metrics.
    # This causes a deadlock on prometheus_client's internal registry lock.
    # We fix this by forcing cache initialization BEFORE registering our collector.
    from django.core.cache import cache
    try:
        cache.get("dummy_init_key")
    except Exception:
        pass

    REGISTRY.register(UserAccountsCollector())
    register_collectors._registered = True
