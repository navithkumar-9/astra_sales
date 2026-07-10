from django.db import models
from core.models.base import TimeStampedModel
from core.models.enquiry import Enquiry
from core.models.user import User

class EnquiryAuditLog(TimeStampedModel):
    enquiry = models.ForeignKey(Enquiry, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    field_name = models.CharField(max_length=100)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'enquiry_audit_logs'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.enquiry.project_number} - {self.field_name} changed by {self.user.username if self.user else 'System'}"
