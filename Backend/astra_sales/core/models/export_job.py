from django.db import models
from django.utils import timezone
from core.models.base import TimeStampedModel
from core.models.user import User

class ExportJob(TimeStampedModel):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='export_jobs')
    status = models.CharField(max_length=20, default='PENDING', choices=STATUS_CHOICES, db_index=True)
    progress = models.IntegerField(default=0)  # 0 to 100
    file_path = models.CharField(max_length=512, blank=True, null=True)
    total_records = models.IntegerField(default=0)
    exported_records = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, null=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'export_jobs'
        ordering = ['-created_at']

    def __str__(self):
        return f"ExportJob {self.id} - {self.status} ({self.progress}%)"
