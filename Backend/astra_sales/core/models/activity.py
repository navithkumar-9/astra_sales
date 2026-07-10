from django.db import models
from core.models.base import TimeStampedModel
from core.models.enquiry import Enquiry
from core.models.user import User

class Activity(TimeStampedModel):
    ACTIVITY_TYPES = [
        ('NOTE', 'Note'),
        ('CALL', 'Call'),
        ('EMAIL', 'Email'),
        ('MEETING', 'Meeting'),
        ('SYSTEM', 'System Event')
    ]

    enquiry = models.ForeignKey(Enquiry, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES, default='NOTE')
    description = models.TextField()

    class Meta:
        db_table = 'enquiry_activities'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.activity_type} on {self.enquiry.project_number} by {self.user.username if self.user else 'System'}"
