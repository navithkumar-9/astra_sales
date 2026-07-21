import os
from django.utils import timezone
from core.models.enquiry import Enquiry
from core.services.export.strategies.csv_strategy import CSVExportStrategy
from core.services.export.storage.local_storage import LocalStorageProvider

class ReportService:
    """
    Dedicated service for generating the latest RFQ performance reports.
    Follows Single Responsibility Principle (SRP) and Open/Closed Principle (OCP).
    """

    @staticmethod
    def generate_latest_rfq_report() -> str:
        """
        Generates the latest RFQ pipeline report as a CSV file.
        Saves it using the LocalStorageProvider with a daily-tracker style name.
        
        Returns:
            str: The absolute local file path of the generated report.
        """
        storage_provider = LocalStorageProvider()
        strategy = CSVExportStrategy()
        
        # Name pattern matching the reference visual style: Daily-Tracker-DD-MM-YYYY.csv
        current_date_str = timezone.now().strftime("%d-%m-%Y")
        file_key = f"Daily-Tracker-{current_date_str}.csv"
        
        # Always retrieve the latest data
        queryset = Enquiry.objects.all().order_by('-created_at')
        
        # Export using strategy and storage provider
        completed_path = strategy.export(
            queryset=queryset,
            storage_provider=storage_provider,
            file_key=file_key
        )
        return completed_path
