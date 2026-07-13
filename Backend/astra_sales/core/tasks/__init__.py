# Celery tasks package
from .sla_tasks import check_sla_violations
from .cache_tasks import refresh_all_caches, refresh_dashboard_cache, refresh_enquiries_cache

__all__ = [
    'check_sla_violations',
    'refresh_all_caches',
    'refresh_dashboard_cache',
    'refresh_enquiries_cache'
]

# Define async tasks here. Celery autodiscover_tasks() will find them.
#
# Example:
#   from celery import shared_task
#   
#   @shared_task
#   def send_notification_email(user_id, message):
#       ...
