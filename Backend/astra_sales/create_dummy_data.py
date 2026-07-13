import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'astra_sales.settings')
django.setup()

from core.models.sbu import SBU
from core.models.division import Division
from core.models.fg import FG
from core.models.customer import Customer
from core.models.enquiry import Enquiry, EnquiryFGDetail
from core.models.user import User

print("Starting dummy data generation...")

# 1. SBUs
sbu_names = ['Automotive', 'Aerospace', 'Healthcare', 'Industrial']
sbus = []
for name in sbu_names:
    sbu, _ = SBU.objects.get_or_create(name=name)
    sbus.append(sbu)

# 2. Divisions
div_names = ['North America', 'Europe', 'Asia Pacific', 'Latin America']
divisions = []
for name in div_names:
    div, _ = Division.objects.get_or_create(name=name)
    divisions.append(div)

# 3. FG Types
fg_types = ['Engine Component', 'Wing Assembly', 'Surgical Tool', 'Conveyor Belt', 'Brake Pad', 'Sensor Module']
fgs = []
for name in fg_types:
    fg, _ = FG.objects.get_or_create(fg_type=name)
    fgs.append(fg)

# 4. Customers
customer_data = [
    {'name': 'Ford Motor Company', 'email': 'purchasing@ford.com', 'contact': '+1-800-392-3673', 'region': 'USA'},
    {'name': 'Boeing', 'email': 'sales@boeing.com', 'contact': '+1-800-263-4641', 'region': 'USA'},
    {'name': 'Medtronic', 'email': 'orders@medtronic.com', 'contact': '+1-800-633-8766', 'region': 'Ireland'},
    {'name': 'Siemens', 'email': 'procurement@siemens.com', 'contact': '+49-800-222-222', 'region': 'Germany'}
]
customers = []
for c_data in customer_data:
    cust, _ = Customer.objects.get_or_create(name=c_data['name'])
    customers.append(cust)

# Fetch a Sales Rep for assignment
sales_rep = User.objects.filter(role='SALES_REP').first()

# 4.5 RFQ Types
rfq_types = ['Standard', 'Urgent', 'Tender']
rfqs = []
from core.models.rfq import RFQ
for name in rfq_types:
    rfq_obj, _ = RFQ.objects.get_or_create(name=name)
    rfqs.append(rfq_obj)

# 5. Enquiries
enquiry_statuses = ['Pending with Engg', 'Pending with Costing', 'Pending with Sales', 'Sales to Quote', 'Quote Submitted']

# Helper to generate random date
def random_date(start_days_ago, end_days_ago):
    return (timezone.now() - timedelta(days=random.randint(end_days_ago, start_days_ago))).date()

def random_time():
    return (timezone.now() - timedelta(minutes=random.randint(10, 500))).time()

for i in range(1, 21): # Create 20 enquiries
    project_num = f"PRJ-{2026}{i:04d}"
    status = random.choice(enquiry_statuses)
    
    enq, created = Enquiry.objects.get_or_create(
        project_number=project_num,
        defaults={
            'rfq_no': f"RFQ-{i*100}",
            'customer': random.choice(customers),
            'sbu': random.choice(sbus),
            'division': random.choice(divisions),
            'project_name': f"Project {project_num}",
            'status': status,
            'sales_rep': sales_rep,
            'quote_value': random.randint(10000, 500000) if status in ['Quote Submitted', 'Sales to Quote'] else None,
            'rfq_date': random_date(40, 10),
            'rfq_due_date': random_date(10, -10),
            'rfq_due_time': random_time(),
            'rfq_assign_date': random_date(30, 5),
            'rfq_type': random.choice(rfqs),
            'fg_type': random.choice(fgs)
        }
    )
    
    if created:
        # Add 1 to 3 FG Details per Enquiry
        for _ in range(random.randint(1, 3)):
            EnquiryFGDetail.objects.create(
                enquiry=enq,
                fg_part_no=f"PART-{random.randint(1000, 9999)}",
                description="Dummy part description",
                qty=random.randint(10, 1000)
            )

print("Dummy data generated successfully!")
