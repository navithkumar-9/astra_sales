from django.db import models
from .base import TimeStampedModel

class RFQ(TimeStampedModel):
    name = models.CharField(max_length=255, unique=True, verbose_name="RFQ Name")

    def __str__(self):
        return self.name
