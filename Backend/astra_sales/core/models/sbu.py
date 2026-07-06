from django.db import models
from .base import TimeStampedModel

class SBU(TimeStampedModel):
    name = models.CharField(max_length=255, unique=True, verbose_name="SBU Name")

    def __str__(self):
        return self.name
