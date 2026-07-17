import os
import django
import sys
import json
import datetime

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "astra_sales.settings")
django.setup()

from django.test import RequestFactory
from django.utils import timezone
from core.models import User, Customer, SBU, Division, RFQ, FG
from core.serializers.enquiry import EnquirySerializer

def run_e2e():
    print("--- Starting End-to-End API Workflow Verification ---")
    
    rfq_tracker, _ = User.objects.get_or_create(username="rfq1", defaults={"role": "RFQ_TRACKER", "name": "RFQ Tracker"})
    sales_rep, _ = User.objects.get_or_create(username="sales1", defaults={"role": "SALES_REP", "name": "Sales Rep"})
    
    customer, _ = Customer.objects.get_or_create(name="Test Customer")
    sbu, _ = SBU.objects.get_or_create(name="Test SBU")
    division, _ = Division.objects.get_or_create(name="Test Division")
    rfq, _ = RFQ.objects.get_or_create(name="Test RFQ")
    fg, _ = FG.objects.get_or_create(fg_type="Test FG")

    rfq_date = timezone.now().date()
    rfq_due_date = rfq_date + datetime.timedelta(days=10)
    
    print("Step 1: Creating Enquiry (Pending with Engg)")
    payload = {
        "project_number": f"E2E-{datetime.datetime.now().timestamp()}",
        "rfq_date": rfq_date.isoformat(),
        "rfq_no": "RFQ-1234",
        "customer": customer.id,
        "sbu": sbu.id,
        "project_name": "E2E Verification Project",
        "division": division.id,
        "rfq_due_date": rfq_due_date.isoformat(),
        "rfq_due_time": "10:00:00",
        "rfq_assign_date": rfq_date.isoformat(),
        "rfq_type": rfq.id,
        "fg_type": fg.id,
        "sales_rep": sales_rep.id,
        "fg_details": [{"fg_part_no": "A1", "qty": 100, "description": "Part A"}]
    }
    
    factory = RequestFactory()
    request = factory.post("/api/enquiries/", json.dumps(payload), content_type="application/json")
    request.user = rfq_tracker
    
    serializer = EnquirySerializer(data=payload, context={"request": request})
    if not serializer.is_valid():
        print("FAIL Create Validation:", serializer.errors)
        return
    
    enquiry = serializer.save()
    print(f"SUCCESS: Enquiry Created ID {enquiry.id}, Status: {enquiry.status}")
    
    print("\nStep 2: Editing Engineering Details")
    payload_engg = payload.copy()
    payload_engg.update({
        "status": "Pending with Costing",
        "ed_of_engg": rfq_date.isoformat(),
        "actual_date_of_engg": rfq_date.isoformat(),
        "engg_remarks": "Engineering done",
        "po_document": None # Simulate what happens when file is unmodified and frontend sends null, or it was never uploaded
    })
    
    enquiry.po_document.name = "po_documents/false_positive.pdf"
    
    req_engg = factory.put(f"/api/enquiries/{enquiry.id}/", json.dumps(payload_engg), content_type="application/json")
    req_engg.user = rfq_tracker
    
    ser_engg = EnquirySerializer(enquiry, data=payload_engg, context={"request": req_engg})
    if not ser_engg.is_valid():
        print("FAIL Engg Validation:", ser_engg.errors)
        return
    
    enquiry = ser_engg.save()
    print(f"SUCCESS: Engineering Saved. Status is now: {enquiry.status}")
    
    print("\nStep 3: Editing Costing Details")
    payload_cost = payload_engg.copy()
    payload_cost.update({
        "status": "Sales to Quote",
        "ed_of_costing": rfq_date.isoformat(),
        "actual_date_of_costing": rfq_date.isoformat(),
        "costing_remarks": "Costing done"
    })
    
    req_cost = factory.put(f"/api/enquiries/{enquiry.id}/", json.dumps(payload_cost), content_type="application/json")
    req_cost.user = rfq_tracker
    
    ser_cost = EnquirySerializer(enquiry, data=payload_cost, context={"request": req_cost})
    if not ser_cost.is_valid():
        print("FAIL Costing Validation:", ser_cost.errors)
        return
    
    enquiry = ser_cost.save()
    print(f"SUCCESS: Costing Saved. Status is now: {enquiry.status}")
    print("\n--- ALL E2E VERIFICATIONS PASSED ---")

if __name__ == "__main__":
    run_e2e()

