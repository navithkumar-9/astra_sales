import logging
import traceback
from celery import shared_task
from django.utils import timezone
from core.models.export_job import ExportJob
from core.models.enquiry import Enquiry
from core.repositories.export_repository import ExportRepository
from core.services.export.storage.local_storage import LocalStorageProvider
from core.services.export.notifications.database_notifier import DatabaseNotificationService
from core.services.export.strategies.csv_strategy import CSVExportStrategy

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def run_export_task(self, job_id: int, export_format: str, filters: dict):
    """
    Background Celery task to execute the data export processing.
    Implements error handling, progress callbacks, and resource cleanup.
    Follows Single Responsibility Principle (SRP).
    """
    repository = ExportRepository()
    storage_provider = LocalStorageProvider()
    notifier = DatabaseNotificationService()
    strategies = {
        'csv': CSVExportStrategy()
    }

    try:
        # Step 1: Fetch job and target queryset
        job = repository.get(job_id)
        queryset = Enquiry.objects.all().order_by('-created_at')

        # Apply filters (basic support for status and search)
        if filters:
            status_filter = filters.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            search_filter = filters.get('search')
            if search_filter:
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(project_number__icontains=search_filter) |
                    Q(project_name__icontains=search_filter) |
                    Q(rfq_no__icontains=search_filter)
                )

        total_records = queryset.count()
        repository.mark_as_processing(job_id, total_records)

        # Handle empty dataset
        if total_records == 0:
            file_key = f"export_{job_id}_{int(timezone.now().timestamp())}.{export_format}"
            completed_path = strategies[export_format].export(
                queryset, storage_provider, file_key
            )
            repository.mark_as_completed(job_id, completed_path)
            notifier.notify_success(
                job.user, 
                f"Export job #{job_id} processed with 0 records", 
                f"/api/exports/{job_id}/download/"
            )
            return f"Job #{job_id} completed successfully (0 records)."

        # Step 2: Define progress update callback
        def progress_callback(exported_count):
            progress_pct = int((exported_count / total_records) * 100)
            # Bound check
            progress_pct = min(max(progress_pct, 0), 99)
            repository.update_progress(job_id, exported_count, progress_pct)

        # Step 3: Run Strategy
        file_key = f"export_{job_id}_{int(timezone.now().timestamp())}.{export_format}"
        strategy = strategies[export_format]

        completed_path = strategy.export(
            queryset=queryset,
            storage_provider=storage_provider,
            file_key=file_key,
            progress_callback=progress_callback
        )

        # Step 4: Finalize Job & Notify User
        repository.mark_as_completed(job_id, completed_path)
        notifier.notify_success(
            job.user, 
            f"Export job #{job_id} containing {total_records} records", 
            f"/api/exports/{job_id}/download/"
        )

        return f"Job #{job_id} completed successfully ({total_records} records)."

    except Exception as exc:
        logger.exception("Error executing export job #%s", job_id)
        # Update database with error state
        error_msg = f"{str(exc)}\n{traceback.format_exc()}"
        try:
            repository.mark_as_failed(job_id, error_msg[:1000])
            
            # Send notification about failure
            job_obj = repository.get(job_id)
            notifier.notify_failure(job_obj.user, f"Export job #{job_id} failed", str(exc))
        except Exception:
            logger.exception("Failed to write task failure to database.")

        # Retry logic if transient/network error (optional, depending on requirements)
        # For general code issues or database logic errors, don't retry.
        # self.retry(exc=exc)
        
        raise exc
