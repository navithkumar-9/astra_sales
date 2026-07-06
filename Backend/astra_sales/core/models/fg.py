from django.db import models
from .base import TimeStampedModel

class FG(TimeStampedModel):
    fg_type = models.CharField(max_length=255, unique=True, verbose_name="FG Type")

    def __str__(self):
        return self.fg_type
