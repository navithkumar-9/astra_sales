from celery import shared_task
from django.utils import timezone
from core.models.enquiry import Enquiry
from core.models.activity import Activity

@shared_task
def check_sla_violations():
    """
    Nightly task to detect enquiries that have been stuck for too long without progress.
    Logs an SLA warning to the activity timeline.
    """
    # Find all active enquiries (not won/lost/po logged)
    active_statuses = ['Pending with Engg', 'Pending with Costing', 'Pending with Sales', 'Sales to Quote']
    enquiries = Enquiry.objects.filter(status__in=active_statuses)
    
    warnings_created = 0

    for enq in enquiries:
        # Check if aging is over SLA (e.g. 5 days)
        if enq.rfq_aging > 5:
            # Prevent spamming: Check if we already logged a warning for this status recently
            recent_warning = Activity.objects.filter(
                enquiry=enq,
                activity_type='SYSTEM',
                description__icontains=f"SLA Warning: Project has been pending in {enq.status}",
                created_at__date=timezone.now().date()
            ).exists()

            if not recent_warning:
                Activity.objects.create(
                    enquiry=enq,
                    user=None, # System action
                    activity_type='SYSTEM',
                    description=f"🚨 SLA Warning: Project has been pending in '{enq.status}' for {enq.rfq_aging} days."
                )
                warnings_created += 1
                
                # In the future, we could trigger an email here:
                # MailService.send_sla_warning_email(enq)

    return f"SLA check complete. Logged {warnings_created} warnings."
