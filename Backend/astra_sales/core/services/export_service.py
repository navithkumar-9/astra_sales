import os
from django.conf import settings
from rest_framework.exceptions import PermissionDenied, NotFound
from core.repositories.export_repository import ExportRepository
from core.services.export.storage.local_storage import LocalStorageProvider
from core.services.export.notifications.database_notifier import DatabaseNotificationService
from core.services.export.strategies.csv_strategy import CSVExportStrategy

class ExportService:
    """
    Main business coordinator service for export management.
    Applies Dependency Injection for Strategy, Storage, and Notifiers.
    Follows Single Responsibility Principle (SRP) and Dependency Inversion Principle (DIP).
    """

    def __init__(
        self,
        repository: ExportRepository = None,
        storage_provider = None,
        notifier = None,
        strategies = None
    ):
        self.repository = repository or ExportRepository()
        self.storage_provider = storage_provider or LocalStorageProvider()
        self.notifier = notifier or DatabaseNotificationService()
        self.strategies = strategies or {
            'csv': CSVExportStrategy()
        }

    def start_export(self, user, export_format: str, filters: dict) -> int:
        """
        Register a new export job and queue the Celery task.
        """
        if export_format not in self.strategies:
            raise ValueError(f"Unsupported export format: {export_format}")

        # Create PENDING job in DB
        job = self.repository.create(
            user=user,
            status='PENDING',
            progress=0,
            total_records=0,
            exported_records=0
        )

        # Trigger Celery Task asynchronously
        from core.tasks.export_tasks import run_export_task
        run_export_task.delay(job.id, export_format, filters)

        return job.id

    def get_job_status(self, user, job_id: int):
        """Retrieve export job progress and details."""
        job = self.repository.get(job_id)
        if job.user != user and user.role not in ['SUPERADMIN', 'ADMIN']:
            raise PermissionDenied("You do not have permission to view this export job.")
        return job

    def delete_job(self, user, job_id: int) -> None:
        """Cancel/Delete the export job and remove any stored files."""
        job = self.repository.get(job_id)
        if job.user != user and user.role not in ['SUPERADMIN', 'ADMIN']:
            raise PermissionDenied("You do not have permission to delete this export job.")
        
        # Delete file if exists
        if job.file_path:
            self.storage_provider.delete(job.file_path)

        self.repository.delete(job)

    def get_download_path(self, user, job_id: int) -> str:
        """Get file path if completed."""
        job = self.get_job_status(user, job_id)
        if job.status != 'COMPLETED':
            raise ValueError("File is not ready for download.")
        if not job.file_path or not os.path.exists(job.file_path):
            raise NotFound("Export file not found on server.")
        return job.file_path
