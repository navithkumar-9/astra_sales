from django.db import transaction
import logging
from rest_framework.exceptions import PermissionDenied
from core.models.enquiry import Enquiry, EnquiryFGDetail
from core.services.audit_service import AuditService
from core.services.cache_service import CacheService


logger = logging.getLogger(__name__)


def refresh_enquiry_caches_after_commit():
    CacheService.invalidate_enquiry_dependencies()
    try:
        CacheService.refresh_enquiry_dependencies_async()
    except Exception:
        logger.exception("Unable to queue enquiry cache refresh task.")

class EnquiryService:
    @staticmethod
    @transaction.atomic
    def create_enquiry(validated_data, user=None):
        fg_details_data = validated_data.pop('fg_details', [])
        enquiry = Enquiry.objects.create(**validated_data)
        for detail_data in fg_details_data:
            detail_data.pop('id', None)
            EnquiryFGDetail.objects.create(enquiry=enquiry, **detail_data)
            
        # Log default creation activity
        from core.models.activity import Activity
        creator_name = user.name or user.username if user else 'System'
        Activity.objects.create(
            enquiry=enquiry,
            user=user,
            activity_type='SYSTEM',
            description=f"🚨 Project registered and created by {creator_name}."
        )

        transaction.on_commit(refresh_enquiry_caches_after_commit)

        return enquiry

    @staticmethod
    def send_stage_notifications(enquiry, new_status):
        from core.models.notification import Notification
        from core.models.user import User, RoleChoices
        
        message = f"🔔 Project {enquiry.project_number} has moved to stage '{new_status}'."
        
        users_to_notify = []
        if new_status in ['Pending with Engg', 'Pending with Costing']:
            # Notify RFQ Trackers
            users_to_notify = list(User.objects.filter(role=RoleChoices.RFQ_TRACKER))
        elif new_status in ['Sales to Quote', 'Pending with Sales', 'Quote Submitted']:
            # Notify the assigned Sales Rep
            if enquiry.sales_rep:
                users_to_notify = [enquiry.sales_rep]
        
        # Also notify superadmins and admins
        admins = list(User.objects.filter(role__in=[RoleChoices.SUPERADMIN, RoleChoices.ADMIN]))
        all_recipients = set(users_to_notify + admins)
        
        notifications = [
            Notification(user=u, message=message, notification_type='STAGE_CHANGE')
            for u in all_recipients
        ]
        Notification.objects.bulk_create(notifications)

    @staticmethod
    @transaction.atomic
    def update_enquiry(instance, validated_data, user=None):
        from core.services.workflow_engine import WorkflowEngine
        from core.models.activity import Activity

        # Pessimistic Locking
        instance = Enquiry.objects.select_for_update().get(id=instance.id)

        fg_details_data = validated_data.pop('fg_details', None)

        # Enforce field permissions based on current stage and user role
        WorkflowEngine.enforce_field_permissions(instance, validated_data, user)
        
        # Enforce status change logic
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        if old_status != new_status:
            WorkflowEngine.validate_transition(instance, old_status, new_status, user)
            
            if new_status == 'Pending with Engg':
                validated_data['ed_of_engg'] = None
                validated_data['actual_date_of_engg'] = None
            elif new_status == 'Pending with Costing':
                validated_data['ed_of_costing'] = None
                validated_data['actual_date_of_costing'] = None
            elif new_status in ['Sales to Quote', 'Pending with Sales']:
                validated_data['ed_of_sales'] = None
                validated_data['actual_date_of_sales'] = None

        # Track audit logs
        AuditService.log_enquiry_changes(instance, validated_data, user)

        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Log manual status changes and trigger notifications
        user_name = user.name or user.username if user else 'System'
        if old_status != new_status:
            Activity.objects.create(
                enquiry=instance,
                user=user,
                activity_type='SYSTEM',
                description=f"📋 Stage manually updated from '{old_status}' to '{new_status}' by {user_name}."
            )
            EnquiryService.send_stage_notifications(instance, new_status)

        # Check and handle auto-advance loop
        auto_status = WorkflowEngine.check_auto_advance(instance)
        while auto_status != instance.status:
            prev_status = instance.status
            instance.status = auto_status
            instance.save()
            Activity.objects.create(
                enquiry=instance,
                user=None,
                activity_type='SYSTEM',
                description=f"🤖 Stage automatically advanced from '{prev_status}' to '{auto_status}' (mandatory fields completed)."
            )
            EnquiryService.send_stage_notifications(instance, auto_status)
            auto_status = WorkflowEngine.check_auto_advance(instance)

        # Update FG details if provided
        if fg_details_data is not None:
            existing_fgs = {fg.id: fg for fg in instance.fg_details.all()}
            sent_ids = []
            
            for detail_data in fg_details_data:
                fg_id = detail_data.get('id', None)
                if fg_id and fg_id in existing_fgs:
                    # Update existing
                    fg = existing_fgs[fg_id]
                    fg.fg_part_no = detail_data.get('fg_part_no', fg.fg_part_no)
                    fg.description = detail_data.get('description', fg.description)
                    fg.qty = detail_data.get('qty', fg.qty)
                    fg.save()
                    sent_ids.append(fg_id)
                else:
                    # Create new
                    detail_data.pop('id', None)
                    new_fg = EnquiryFGDetail.objects.create(enquiry=instance, **detail_data)
                    sent_ids.append(new_fg.id)
            
            # Delete any that were not sent in the payload
            for fg_id, fg in existing_fgs.items():
                if fg_id not in sent_ids:
                    fg.delete()

        transaction.on_commit(refresh_enquiry_caches_after_commit)

        return instance
