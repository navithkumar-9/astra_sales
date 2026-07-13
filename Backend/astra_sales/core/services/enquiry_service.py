from django.db import transaction
from rest_framework.exceptions import PermissionDenied
from core.models.enquiry import Enquiry, EnquiryFGDetail
from core.services.audit_service import AuditService

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

        # Trigger background cache refresh
        from core.tasks.cache_tasks import refresh_all_caches
        transaction.on_commit(lambda: refresh_all_caches.delay())

        return enquiry

    @staticmethod
    @transaction.atomic
    def update_enquiry(instance, validated_data, user=None):
        # Enforce Field-Level Access Control for Sales Reps
        if user and user.role == 'SALES_REP':
            restricted_fields = ['quote_value', 'po_value', 'sales_rep']
            for field in restricted_fields:
                if field in validated_data and getattr(instance, field) != validated_data[field]:
                    raise PermissionDenied(f"Sales Reps are not allowed to modify {field}.")

        # Pessimistic Locking
        instance = Enquiry.objects.select_for_update().get(id=instance.id)

        fg_details_data = validated_data.pop('fg_details', None)
        
        # Enforce status change logic
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        if old_status != new_status:
            if new_status == 'Pending with Engg':
                validated_data['ed_of_engg'] = None
                validated_data['actual_date_of_engg'] = None
            elif new_status == 'Pending with Costing':
                validated_data['ed_of_costing'] = None
                validated_data['actual_date_of_costing'] = None
            elif new_status in ['Sales to Quote', 'Pending with Sales']:
                validated_data['ed_of_sales'] = None
                validated_data['actual_date_of_sales'] = None

        # Track audit logs (using AuditService)
        AuditService.log_enquiry_changes(instance, validated_data, user)

        # Update Enquiry fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

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

        # Trigger background cache refresh
        from core.tasks.cache_tasks import refresh_all_caches
        transaction.on_commit(lambda: refresh_all_caches.delay())

        return instance
