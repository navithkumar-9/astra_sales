from django.db.models import QuerySet
from core.services.export.strategies.base_strategy import BaseExportStrategy
from core.services.export.storage.base_storage import BaseStorageProvider
from core.services.export.writers.csv_writer import ChunkedCSVWriter

class CSVExportStrategy(BaseExportStrategy):
    """
    CSV implementation of the export strategy.
    Implements memory-efficient database cursor chunking and buffered I/O.
    Follows Strategy Pattern, OCP, and SRP.
    """

    HEADERS = [
        "Project Number", "RFQ Date", "RFQ No", "Customer", "SBU", 
        "Project Name", "Division", "Status", "Sales Rep", "RFQ Due Date",
        "Quote Value", "PO Value", "Created At"
    ]

    def export(self, queryset: QuerySet, storage_provider: BaseStorageProvider, file_key: str, progress_callback=None) -> str:
        # Step 1: Write header
        header_bytes = ChunkedCSVWriter.write_header(self.HEADERS)
        storage_provider.save_chunk(file_key, header_bytes, append=False)

        # Step 2: Query chunking optimization using iterator
        chunk_size = 1000
        buffer = []
        exported_count = 0

        # Retrieve optimized columns directly using select_related
        optimized_qs = queryset.select_related('customer', 'sbu', 'division', 'sales_rep')

        for enquiry in optimized_qs.iterator(chunk_size=chunk_size):
            row = [
                enquiry.project_number,
                str(enquiry.rfq_date) if enquiry.rfq_date else "",
                enquiry.rfq_no,
                enquiry.customer.name if enquiry.customer else "",
                enquiry.sbu.name if enquiry.sbu else "",
                enquiry.project_name,
                enquiry.division.name if enquiry.division else "",
                enquiry.status,
                enquiry.sales_rep.username if enquiry.sales_rep else "",
                str(enquiry.rfq_due_date) if enquiry.rfq_due_date else "",
                str(enquiry.quote_value) if enquiry.quote_value is not None else "",
                str(enquiry.po_value) if enquiry.po_value is not None else "",
                enquiry.created_at.strftime('%Y-%m-%d %H:%M:%S') if enquiry.created_at else ""
            ]
            buffer.append(row)
            exported_count += 1

            if len(buffer) >= chunk_size:
                # Write to disk
                row_bytes = ChunkedCSVWriter.write_rows(buffer)
                storage_provider.save_chunk(file_key, row_bytes, append=True)
                buffer.clear()

                if progress_callback:
                    progress_callback(exported_count)

        # Write any remaining rows in buffer
        if buffer:
            row_bytes = ChunkedCSVWriter.write_rows(buffer)
            storage_provider.save_chunk(file_key, row_bytes, append=True)
            buffer.clear()
            
            if progress_callback:
                progress_callback(exported_count)

        # Finalize and return target path
        return storage_provider.finalize(file_key)
