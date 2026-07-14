# Celery tasks package
from .sla_tasks import check_sla_violations
from .cache_tasks import refresh_all_caches, refresh_dashboard_cache, refresh_enquiries_cache
from .export_tasks import run_export_task
from .mail_tasks import send_mail_all_task

__all__ = [
    'check_sla_violations',
    'refresh_all_caches',
    'refresh_dashboard_cache',
    'refresh_enquiries_cache',
    'run_export_task',
    'send_mail_all_task'
]


# Define async tasks here. Celery autodiscover_tasks() will find them.
#
# Example:
#   from celery import shared_task
#   
#   @shared_task
#   def send_notification_email(user_id, message):
#       ...
