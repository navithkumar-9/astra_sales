import os
import csv
from django.http import StreamingHttpResponse, FileResponse
from rest_framework import status, permissions
from rest_framework.views import APIView
from core.services.export_service import ExportService
from core.serializers.export import ExportRequestSerializer, ExportJobSerializer
from core.response import success_response, error_response
from core.models.enquiry import Enquiry

class Echo:
    """An object that implements just the write method of the file-like interface."""
    def write(self, value):
        return value

def streaming_export(queryset):
    """
    Generator that outputs database records line-by-line as CSV rows.
    Implements memory-efficient server-side cursor streaming.
    Time Complexity: O(N) where N is the number of rows.
    Memory Complexity: O(1) constant memory.
    """
    pseudo_buffer = Echo()
    writer = csv.writer(pseudo_buffer, quoting=csv.QUOTE_MINIMAL)
    
    # Prepend UTF-8 BOM for Excel compatibility
    yield b'\xef\xbb\xbf'
    
    headers = [
        "Customer Name", "SBU", "Division", "RFQ Type", "Status", "RFQ Date", "RFQ Due Date", 
        "RFQ Aging", "Clarification To CS", "Clarification From CS", "Remarks / Description", 
        "Expected Date of Engineering", "Actual Date of Engineering", "Engineering Remarks", 
        "Expected Date of Costing", "Actual Date of Costing", "Costing Remarks", 
        "FG Part No Description Quantity", "Quote Date", "Quote Value ($)", "Open-L1 Value ($)", 
        "Open-L1 Date", "Lost Value ($)", "PO No", "PO Receipt Date", "PO Value ($)", "created date"
    ]
    yield writer.writerow(headers).encode('utf-8')
    
    optimized_qs = queryset.select_related('customer', 'sbu', 'division', 'rfq_type').prefetch_related('fg_details')
    
    # Batch query records using database cursor
    for enquiry in optimized_qs.iterator(chunk_size=1000):
        fg_str = " | ".join([
            f"{fg.fg_part_no} - {fg.description} (Qty: {fg.qty})" 
            for fg in enquiry.fg_details.all()
        ])
        
        row = [
            enquiry.customer.name if enquiry.customer else "",
            enquiry.sbu.name if enquiry.sbu else "",
            enquiry.division.name if enquiry.division else "",
            enquiry.rfq_type.name if enquiry.rfq_type else "",
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
            fg_str,
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
        yield writer.writerow(row).encode('utf-8')

class ExportJobAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ExportRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                filters = serializer.validated_data.get('filters', {})
                queryset = Enquiry.objects.all().order_by('-created_at')

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
                
                # Stream CSV directly in HTTP response
                response = StreamingHttpResponse(
                    streaming_export(queryset),
                    content_type="text/csv; charset=utf-8"
                )
                response['Content-Disposition'] = 'attachment; filename="enquiries_export.csv"'
                return response
            except Exception as e:
                return error_response(message=str(e), status_code=status.HTTP_400_BAD_REQUEST)
        return error_response(
            message="Invalid export parameters.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

class ExportJobDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.export_service = ExportService()

    def get(self, request, pk):
        job = self.export_service.get_job_status(request.user, pk)
        serializer = ExportJobSerializer(job)
        return success_response(
            data=serializer.data,
            message="Export job status retrieved successfully."
        )

    def delete(self, request, pk):
        self.export_service.delete_job(request.user, pk)
        return success_response(message="Export job cancelled and deleted successfully.")

class ExportJobDownloadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.export_service = ExportService()

    def get(self, request, pk):
        file_path = self.export_service.get_download_path(request.user, pk)
        response = FileResponse(open(file_path, 'rb'), as_attachment=True, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        return response
