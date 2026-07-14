import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from core.models.mail import Mail
from core.services.dashboard_service import DashboardService

logger = logging.getLogger(__name__)

@shared_task(name="core.tasks.mail_tasks.send_mail_all_task")
def send_mail_all_task():
    """
    Asynchronously queries all registered email addresses, compiles the current
    dashboard metrics, and dispatches a comprehensive CRM status email.
    """
    try:
        emails = list(Mail.objects.values_list('email', flat=True))
        if not emails:
            logger.info("No registered email addresses found to mail.")
            return "No recipients found."

        # Compile dashboard data
        stats = DashboardService.calculate_stats()
        kpis = stats.get('kpis', {})

        subject = "Astra CRM - Real-time Pipeline Performance Summary"
        
        # Build raw text report
        message_body = (
            "Hello,\n\n"
            "Here is your real-time CRM performance and pipeline summary from Astra Sales:\n\n"
            f"• Total Enquiries: {kpis.get('totalEnquiryCount', 0)}\n"
            f"• Overall Pending Enquiries: {kpis.get('overallPendingCount', 0)}\n"
            f"• Stuck Enquiries (>90 Days): {kpis.get('quoted90Days', 0)}\n"
            f"• Budgetary Quotes: {kpis.get('budgetaryCount', 0)}\n"
            f"• Open (L1) Opportunity Count: {kpis.get('openL1Count', 0)}\n"
            f"• Won Enquiries: {kpis.get('wonCount', 0)}\n"
            f"• Lost Enquiries: {kpis.get('lostCount', 0)}\n"
            f"• On Hold Enquiries: {kpis.get('holdCount', 0)}\n\n"
            "Financial Pipeline Values:\n"
            f"• Total Quoted Value: INR {kpis.get('quotedValue', 0):,}\n"
            f"• Total PO Value: INR {kpis.get('poValue', 0):,}\n"
            f"• Open L1 Value: INR {kpis.get('openL1Value', 0):,}\n"
            f"• Lost Value: INR {kpis.get('lostValue', 0):,}\n\n"
            "Due Dates Status:\n"
            f"• Enquiries Due Today: {kpis.get('todaysDue', 0)}\n"
            f"• Enquiries Due Tomorrow: {kpis.get('tomorrowDue', 0)}\n\n"
            "Best Regards,\n"
            "Astra CRM Automations System"
        )

        send_mail(
            subject=subject,
            message=message_body,
            from_email=settings.DEFAULT_FROM_EMAIL or 'no-reply@astracrm.com',
            recipient_list=emails,
            fail_silently=False,
        )

        logger.info(f"Successfully sent CRM report to {len(emails)} recipients.")
        return f"Report successfully sent to {len(emails)} recipients."
    except Exception as e:
        logger.error(f"Error executing send_mail_all_task: {str(e)}")
        raise e
