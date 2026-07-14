from abc import ABC, abstractmethod
from typing import Dict, Any, Generator
from django.db.models import QuerySet
from core.services.export.storage.base_storage import BaseStorageProvider

class BaseExportStrategy(ABC):
    """
    Abstract interface for export strategies (CSV, Excel, JSON, etc.).
    Follows Open/Closed Principle (OCP) and Strategy Pattern.
    """

    @abstractmethod
    def export(self, queryset: QuerySet, storage_provider: BaseStorageProvider, file_key: str, progress_callback=None) -> str:
        """
        Execute export logic, stream to storage provider, and return path.
        """
        pass
