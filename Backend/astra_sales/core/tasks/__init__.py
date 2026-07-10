# Celery tasks package
from .sla_tasks import check_sla_violations

__all__ = [
    'check_sla_violations'
]

# Define async tasks here. Celery autodiscover_tasks() will find them.
#
# Example:
#   from celery import shared_task
#   
#   @shared_task
#   def send_notification_email(user_id, message):
#       ...
