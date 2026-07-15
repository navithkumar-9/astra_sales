from django.db import models
from core.models.base import TimeStampedModel
from core.models.user import User


class EmailLog(TimeStampedModel):
    """
    Audit trail for every email sent by the system.
    Tracks recipient, status, timing, retry count, and failure details.
    Follows Single Responsibility Principle (SRP).
    """

    class Status(models.TextChoices):
        QUEUED = 'QUEUED', 'Queued'
        SENDING = 'SENDING', 'Sending'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'

    recipient_email = models.EmailField(db_index=True)
    subject = models.CharField(max_length=500)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.QUEUED,
        db_index=True
    )
    triggered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_emails'
    )
    batch_id = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Unique identifier for a batch of emails triggered together."
    )
    queued_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    failure_reason = models.TextField(blank=True, default='')
    smtp_response = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'email_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['batch_id', 'status'], name='emaillog_batch_status_idx'),
            models.Index(fields=['-queued_at'], name='emaillog_queued_idx'),
        ]

    def __str__(self):
        return f"Email to {self.recipient_email} [{self.status}]"
