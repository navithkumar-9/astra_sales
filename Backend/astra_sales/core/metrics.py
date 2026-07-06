from prometheus_client import Counter
from prometheus_client.core import GaugeMetricFamily, REGISTRY

from core.models.user import RoleChoices, User


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

        for role in RoleChoices.values:
            for is_active in (True, False):
                metric.add_metric(
                    [role, str(is_active).lower()],
                    User.objects.filter(role=role, is_active=is_active).count(),
                )

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

    REGISTRY.register(UserAccountsCollector())
    register_collectors._registered = True
