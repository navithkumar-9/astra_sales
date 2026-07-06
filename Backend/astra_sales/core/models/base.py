from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base model providing created_at and updated_at timestamps.
    
    All models should inherit from this to ensure consistent
    timestamp tracking across the application (SRP - Single Responsibility).
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']
