import logging
import time
import uuid
from typing import List, Optional

from django.core.mail import get_connection, EmailMessage
from django.conf import settings
from django.utils import timezone

from core.models.mail import Mail
from core.models.email_log import EmailLog
from core.services.dashboard_service import DashboardService
from core.services.cache_service import CacheService

logger = logging.getLogger(__name__)

# Rate limit: max emails per batch before sleeping
BATCH_SIZE = 25
BATCH_SLEEP_SECONDS = 2  # Sleep between batches to respect SMTP rate limits


class EmailService:
    """
    Dedicated service for composing and sending emails.
    Handles connection pooling, batching, rate limiting, logging, and error handling.
    Follows Single Responsibility Principle (SRP) and Dependency Inversion Principle (DIP).
    """

    @staticmethod
    def generate_batch_id() -> str:
        """Generate a unique batch ID for a group of emails."""
        return uuid.uuid4().hex

    @staticmethod
    def compose_crm_report_body() -> str:
        """
        Compile the CRM KPI report body.
        Uses cached dashboard data when available to avoid heavy re-computation.
        """
        from django.template.loader import render_to_string
        
        # Try cache first, fall back to live computation
        stats = CacheService.get_dashboard_stats()
        if not stats:
            stats = DashboardService.calculate_stats()

        kpis = stats.get('kpis', {})

        context = {
            'kpis': kpis,
            'current_date': timezone.now().strftime("%B %d, %Y")
        }
        
        return render_to_string('emails/crm_report.html', context)

    @staticmethod
    def get_all_recipient_emails() -> List[str]:
        """
        Retrieve all registered email addresses using iterator() for memory efficiency.
        Returns a list since we need to iterate multiple times.
        """
        return list(
            Mail.objects.values_list('email', flat=True).iterator(chunk_size=500)
        )

    @staticmethod
    def send_bulk_report(
        subject: str,
        body: str,
        recipients: List[str],
        batch_id: str,
        triggered_by_id: Optional[int] = None
    ) -> dict:
        """
        Send individual emails to each recipient using SMTP connection pooling.
        Each recipient gets their own email (Bug #1 fix: no shared TO header).
        Sends in batches with sleep intervals for rate limiting (Bug #11 fix).
        Logs every email to EmailLog (Bug #5 fix).

        Returns: dict with 'sent' and 'failed' counts.
        """
        from_email = settings.DEFAULT_FROM_EMAIL or 'no-reply@astracrm.com'
        sent_count = 0
        failed_count = 0

        # Create log records upfront as QUEUED
        log_records = []
        for email_addr in recipients:
            log_records.append(EmailLog(
                recipient_email=email_addr,
                subject=subject,
                status=EmailLog.Status.QUEUED,
                triggered_by_id=triggered_by_id,
                batch_id=batch_id,
            ))
        EmailLog.objects.bulk_create(log_records, batch_size=500)

        # Build a lookup: email -> log record id
        log_map = {
            log.recipient_email: log
            for log in EmailLog.objects.filter(batch_id=batch_id)
        }

        # Open a single SMTP connection and reuse it (Bug #10 fix: connection pooling)
        connection = get_connection(fail_silently=False)
        try:
            connection.open()

            for i, email_addr in enumerate(recipients):
                log_entry = log_map.get(email_addr)

                try:
                    if log_entry:
                        log_entry.status = EmailLog.Status.SENDING
                        log_entry.save(update_fields=['status', 'updated_at'])

                    msg = EmailMessage(
                        subject=subject,
                        body=body,
                        from_email=from_email,
                        to=[email_addr],
                        connection=connection,
                    )
                    msg.content_subtype = "html"
                    msg.send(fail_silently=False)

                    sent_count += 1
                    if log_entry:
                        log_entry.status = EmailLog.Status.SENT
                        log_entry.sent_at = timezone.now()
                        log_entry.save(update_fields=['status', 'sent_at', 'updated_at'])

                except Exception as e:
                    failed_count += 1
                    logger.warning(f"Failed to send email to {email_addr}: {e}")
                    if log_entry:
                        log_entry.status = EmailLog.Status.FAILED
                        log_entry.failure_reason = str(e)[:1000]
                        log_entry.retry_count += 1
                        log_entry.save(update_fields=[
                            'status', 'failure_reason', 'retry_count', 'updated_at'
                        ])

                # Rate limiting: sleep between batches (Bug #11 fix)
                if (i + 1) % BATCH_SIZE == 0 and i + 1 < len(recipients):
                    logger.info(
                        f"Rate limit pause after {i + 1}/{len(recipients)} emails. "
                        f"Sleeping {BATCH_SLEEP_SECONDS}s..."
                    )
                    time.sleep(BATCH_SLEEP_SECONDS)

        finally:
            try:
                connection.close()
            except Exception:
                pass

        logger.info(
            f"Batch {batch_id}: sent={sent_count}, failed={failed_count}, "
            f"total={len(recipients)}"
        )
        return {'sent': sent_count, 'failed': failed_count}
