from core.models.export_job import ExportJob
from core.repositories import BaseRepository

class ExportRepository(BaseRepository[ExportJob]):
    """
    Repository layer for ExportJob database operations.
    Follows Single Responsibility Principle (SRP) and Dependency Inversion Principle (DIP).
    """
    model_class = ExportJob

    def get_user_exports(self, user):
        """Retrieve export jobs created by a specific user."""
        return self.filter(user=user)

    def mark_as_processing(self, job_id, total_records):
        """Mark job as in-progress."""
        from django.utils import timezone
        job = self.get(job_id)
        return self.update(job, status='PROCESSING', total_records=total_records, started_at=timezone.now(), progress=0)

    def update_progress(self, job_id, exported_count, progress_percentage):
        """Update exported records and progress percentage."""
        job = self.get(job_id)
        return self.update(job, exported_records=exported_count, progress=progress_percentage)

    def mark_as_completed(self, job_id, file_path):
        """Mark job as successfully completed."""
        from django.utils import timezone
        job = self.get(job_id)
        return self.update(job, status='COMPLETED', file_path=file_path, progress=100, completed_at=timezone.now())

    def mark_as_failed(self, job_id, error_message):
        """Mark job as failed with an error message."""
        from django.utils import timezone
        job = self.get(job_id)
        return self.update(job, status='FAILED', error_message=error_message, completed_at=timezone.now())
