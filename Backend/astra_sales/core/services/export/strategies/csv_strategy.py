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
        "Customer Name", "SBU", "Division", "RFQ Type", "Status", 
        "RFQ Date", "RFQ Due Date", "RFQ Aging", "Clarification To CS", 
        "Clarification From CS", "Remarks / Description", 
        "Expected Date of Engineering", "Actual Date of Engineering", "Engineering Remarks",
        "Expected Date of Costing", "Actual Date of Costing", "Costing Remarks",
        "FG Part No", "Description", "Quantity", "Quote Date", 
        "Quote Value ($)", "Open-L1 Value ($)", "Open-L1 Date", "Lost Value ($)", 
        "PO No", "PO Receipt Date", "PO Value ($)", "created date"
    ]

    def export(self, queryset: QuerySet, storage_provider: BaseStorageProvider, file_key: str, progress_callback=None) -> str:
        # Step 1: Write header
        header_bytes = ChunkedCSVWriter.write_header(self.HEADERS)
        storage_provider.save_chunk(file_key, header_bytes, append=False)

        # Step 2: Query chunking optimization using iterator
        chunk_size = 1000
        buffer = []
        exported_count = 0

        # Retrieve optimized columns directly using select_related and prefetch_related
        optimized_qs = queryset.select_related('customer', 'sbu', 'division', 'sales_rep', 'rfq_type').prefetch_related('fg_details')

        for enquiry in optimized_qs.iterator(chunk_size=chunk_size):
            # Aggregate FG Part No, Description, and Quantity
            parts = enquiry.fg_details.all()
            fg_part_nos = " | ".join([p.fg_part_no for p in parts])
            descriptions = " | ".join([p.description for p in parts])
            quantities = " | ".join([str(p.qty) for p in parts])

            row = [
                enquiry.customer.name if enquiry.customer else "",
                enquiry.sbu.name if enquiry.sbu else "",
                enquiry.division.name if enquiry.division else "",
                enquiry.rfq_type.name if hasattr(enquiry, 'rfq_type') and enquiry.rfq_type else "",
                enquiry.status,
                str(enquiry.rfq_date) if enquiry.rfq_date else "",
                str(enquiry.rfq_due_date) if enquiry.rfq_due_date else "",
                str(enquiry.rfq_aging),
                enquiry.clarification_to_cs,
                enquiry.clarification_from_cs,
                enquiry.remarks,
                str(enquiry.ed_of_engg) if enquiry.ed_of_engg else "",
                str(enquiry.actual_date_of_engg) if enquiry.actual_date_of_engg else "",
                enquiry.engg_remarks,
                str(enquiry.ed_of_costing) if enquiry.ed_of_costing else "",
                str(enquiry.actual_date_of_costing) if enquiry.actual_date_of_costing else "",
                enquiry.costing_remarks,
                fg_part_nos,
                descriptions,
                quantities,
                str(enquiry.quote_date) if enquiry.quote_date else "",
                str(enquiry.quote_value) if enquiry.quote_value is not None else "",
                str(enquiry.open_l1_value) if enquiry.open_l1_value is not None else "",
                str(enquiry.open_l1_date) if enquiry.open_l1_date else "",
                str(enquiry.lost_value) if enquiry.lost_value is not None else "",
                enquiry.po_no,
                str(enquiry.po_receipt_date) if enquiry.po_receipt_date else "",
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
