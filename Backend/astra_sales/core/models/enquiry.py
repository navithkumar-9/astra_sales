from django.db import models
from django.utils import timezone
from core.models.base import TimeStampedModel
from core.models.user import User
from core.models.sbu import SBU
from core.models.division import Division
from core.models.fg import FG
from core.models.rfq import RFQ
from core.models.customer import Customer

class Enquiry(TimeStampedModel):
    project_number = models.CharField(max_length=50, unique=True)
    rfq_date = models.DateField()
    rfq_no = models.CharField(max_length=100)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='enquiries')
    sbu = models.ForeignKey(SBU, on_delete=models.CASCADE, related_name='enquiries')
    project_name = models.CharField(max_length=255)
    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name='enquiries')
    rfq_due_date = models.DateField()
    rfq_due_time = models.TimeField()
    rfq_assign_date = models.DateField()
    rfq_type = models.ForeignKey(RFQ, on_delete=models.CASCADE, related_name='enquiries')
    fg_type = models.ForeignKey(FG, on_delete=models.CASCADE, related_name='enquiries')
    sales_rep = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_enquiries')

    # Estimation tracking fields
    ed_of_engg = models.DateField(null=True, blank=True) # Expected Date of Engineering
    actual_date_of_engg = models.DateField(null=True, blank=True) # Actual Date of Engineering
    engg_remarks = models.TextField(blank=True, default='') # Engineering Remarks
    
    ed_of_costing = models.DateField(null=True, blank=True) # Expected Date of Costing
    actual_date_of_costing = models.DateField(null=True, blank=True) # Actual Date of Costing
    costing_remarks = models.TextField(blank=True, default='') # Costing Remarks
    
    ed_of_sales = models.DateField(null=True, blank=True) # Expected Date of Sales
    actual_date_of_sales = models.DateField(null=True, blank=True) # Actual Date of Sales
    sales_remarks = models.TextField(blank=True, default='') # Sales Remarks
    
    status = models.CharField(max_length=50, default='Pending with Engg')
    clarification_to_cs = models.TextField(blank=True, default='')
    clarification_from_cs = models.TextField(blank=True, default='')
    remarks = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'enquiries'

    @property
    def rfq_aging(self):
        delta = timezone.now().date() - self.rfq_date
        return max(delta.days, 0)

    def __str__(self):
        return f"{self.project_number} - {self.project_name}"


class EnquiryFGDetail(models.Model):
    enquiry = models.ForeignKey(Enquiry, on_delete=models.CASCADE, related_name='fg_details')
    fg_part_no = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    qty = models.IntegerField()

    class Meta:
        db_table = 'enquiry_fg_details'

    def __str__(self):
        return f"{self.fg_part_no} (Qty: {self.qty})"
