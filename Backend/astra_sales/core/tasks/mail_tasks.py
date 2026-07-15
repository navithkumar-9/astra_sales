import logging
from celery import shared_task
from smtplib import SMTPException

logger = logging.getLogger(__name__)

# Cooldown key prefix for idempotency
MAIL_COOLDOWN_CACHE_KEY = "mail_report_cooldown"
MAIL_COOLDOWN_SECONDS = 60


@shared_task(
    name="core.tasks.mail_tasks.send_mail_all_task",
    bind=True,
    autoretry_for=(SMTPException, ConnectionError, OSError),
    retry_backoff=30,
    retry_backoff_max=300,
    retry_jitter=True,
    max_retries=3,
    soft_time_limit=600,
    time_limit=660,
    acks_late=True,
    reject_on_worker_lost=True,
)
def send_mail_all_task(self, triggered_by_id=None):
    """
    Production-hardened Celery task to send CRM pipeline report
    to all registered email addresses.

    Fixes applied:
    - Bug #1:  Individual emails per recipient (no shared TO header)
    - Bug #2:  Auto-retry with exponential backoff for SMTP failures
    - Bug #3:  Soft/hard time limits to prevent worker exhaustion
    - Bug #4:  Streaming queryset via iterator()
    - Bug #5:  Full audit trail via EmailLog model
    - Bug #7:  Uses cached dashboard KPIs when available
    - Bug #8:  Bare 'raise' preserves traceback
    - Bug #10: SMTP connection pooling via get_connection()
    - Bug #11: Rate limiting with batch sleep intervals
    """
    from core.services.email_service import EmailService

    try:
        # Generate unique batch ID for this run
        batch_id = EmailService.generate_batch_id()
        logger.info(f"Starting mail report task. batch_id={batch_id}")

        # Get recipients
        recipients = EmailService.get_all_recipient_emails()
        if not recipients:
            logger.info("No registered email addresses found.")
            return "No recipients found."

        # Compose report
        subject = "Astra CRM - Real-time Pipeline Performance Summary"
        body = EmailService.compose_crm_report_body()

        # Send with connection pooling, rate limiting, and logging
        result = EmailService.send_bulk_report(
            subject=subject,
            body=body,
            recipients=recipients,
            batch_id=batch_id,
            triggered_by_id=triggered_by_id,
        )

        msg = (
            f"Batch {batch_id} complete: "
            f"sent={result['sent']}, failed={result['failed']}, "
            f"total={len(recipients)}"
        )
        logger.info(msg)
        return msg

    except Exception:
        logger.exception("Error executing send_mail_all_task")
        raise  # Bug #8 fix: bare raise preserves traceback
