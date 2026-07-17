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
    rfq_no = models.CharField(max_length=100, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='enquiries')
    sbu = models.ForeignKey(SBU, on_delete=models.PROTECT, related_name='enquiries')
    project_name = models.CharField(max_length=255, db_index=True)
    division = models.ForeignKey(Division, on_delete=models.PROTECT, related_name='enquiries')
    rfq_due_date = models.DateField()
    rfq_due_time = models.TimeField()
    rfq_assign_date = models.DateField()
    rfq_type = models.ForeignKey(RFQ, on_delete=models.PROTECT, related_name='enquiries')
    fg_type = models.ForeignKey(FG, on_delete=models.PROTECT, related_name='enquiries')
    sales_rep = models.ForeignKey(User, on_delete=models.PROTECT, related_name='assigned_enquiries')

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
    
    class StatusChoices(models.TextChoices):
        PENDING_ENGG = 'Pending with Engg', 'Pending with Engineering'
        PENDING_COSTING = 'Pending with Costing', 'Pending with Costing'
        SALES_TO_QUOTE = 'Sales to Quote', 'Sales to Quote'
        PENDING_SALES = 'Pending with Sales', 'Pending with Sales'
        QUOTE_SUBMITTED = 'Quote Submitted', 'Quote Submitted'
        ON_HOLD = 'On Hold', 'On Hold'
        OPEN_L1 = 'Open - L1', 'Open - L1'
        WON = 'Won', 'Won'
        LOST = 'Lost', 'Lost'
        REGRETTED = 'Regretted', 'Regretted'
        QUOTE_REGRETTED = 'Quote Regretted', 'Quote Regretted'

    status = models.CharField(
        max_length=50,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING_ENGG,
        db_index=True
    )
    clarification_to_cs = models.TextField(blank=True, default='')
    clarification_from_cs = models.TextField(blank=True, default='')
    remarks = models.TextField(blank=True, default='')

    # Quote tracking fields
    quote_date = models.DateField(null=True, blank=True)
    quote_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    open_l1_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    open_l1_date = models.DateField(null=True, blank=True)
    lost_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    po_no = models.CharField(max_length=100, blank=True, default='')
    po_receipt_date = models.DateField(null=True, blank=True)
    po_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Document tracking fields
    rfq_document = models.FileField(upload_to='documents/rfq/', null=True, blank=True)
    po_document = models.FileField(upload_to='documents/po/', null=True, blank=True)

    # Aging calculations
    enquiry_aging = models.IntegerField(null=True, blank=True, db_index=True)
    quote_submission_aging = models.IntegerField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = 'enquiries'
        indexes = [
            models.Index(fields=['-created_at'], name='enq_created_at_desc_idx'),
            models.Index(fields=['status', '-created_at'], name='enq_status_created_idx'),
            models.Index(fields=['rfq_date'], name='enq_rfq_date_idx'),
            models.Index(fields=['rfq_due_date'], name='enq_rfq_due_date_idx'),
            models.Index(fields=['quote_date'], name='enq_quote_date_idx'),
        ]
        constraints = [
            models.CheckConstraint(condition=models.Q(quote_value__gte=0), name='check_quote_value_non_negative'),
            models.CheckConstraint(condition=models.Q(open_l1_value__gte=0), name='check_open_l1_value_non_negative'),
            models.CheckConstraint(condition=models.Q(lost_value__gte=0), name='check_lost_value_non_negative'),
            models.CheckConstraint(condition=models.Q(po_value__gte=0), name='check_po_value_non_negative'),
        ]

    def _parse_date(self, date_val):
        if isinstance(date_val, str):
            from datetime import datetime
            try:
                return datetime.strptime(date_val, '%Y-%m-%d').date()
            except ValueError:
                # Fallback if time is included or different format
                try:
                    return datetime.fromisoformat(date_val).date()
                except ValueError:
                    return None
        return date_val

    @property
    def rfq_aging(self):
        r_date = self._parse_date(self.rfq_date)
        if not r_date:
            return 0
        delta = timezone.now().date() - r_date
        return max(delta.days, 0)

    def save(self, *args, **kwargs):
        q_date = self._parse_date(self.quote_date)
        r_date = self._parse_date(self.rfq_date)
        a_date = self._parse_date(self.actual_date_of_sales)

        # Calculate Enquiry Aging
        if q_date and r_date:
            delta = q_date - r_date
            self.enquiry_aging = max(delta.days, 0)
        else:
            self.enquiry_aging = None

        # Calculate Quote Submission Aging
        if a_date and q_date:
            delta = a_date - q_date
            self.quote_submission_aging = max(delta.days, 0)
        else:
            self.quote_submission_aging = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.project_number} - {self.project_name}"


class EnquiryFGDetail(models.Model):
    enquiry = models.ForeignKey(Enquiry, on_delete=models.CASCADE, related_name='fg_details')
    fg_part_no = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    qty = models.IntegerField()

    class Meta:
        db_table = 'enquiry_fg_details'
        constraints = [
            models.CheckConstraint(condition=models.Q(qty__gte=0), name='check_fg_qty_non_negative'),
        ]

    def __str__(self):
        return f"{self.fg_part_no} (Qty: {self.qty})"
