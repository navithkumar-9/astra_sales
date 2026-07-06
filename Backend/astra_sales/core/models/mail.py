from django.db import models
from .base import TimeStampedModel

class Mail(TimeStampedModel):
    email = models.EmailField(unique=True, verbose_name="Mail Id")

    def __str__(self):
        return self.email
