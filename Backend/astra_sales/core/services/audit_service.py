from core.models.audit import EnquiryAuditLog

class AuditService:
    @staticmethod
    def log_enquiry_changes(instance, validated_data, user=None):
        audit_fields = ['status', 'quote_value', 'po_value', 'ed_of_engg', 'ed_of_costing', 'ed_of_sales']
        changes = []
        for field in audit_fields:
            if field in validated_data:
                old_val = getattr(instance, field)
                new_val = validated_data[field]
                if old_val != new_val:
                    changes.append(EnquiryAuditLog(
                        enquiry=instance,
                        user=user,
                        field_name=field,
                        old_value=str(old_val) if old_val is not None else None,
                        new_value=str(new_val) if new_val is not None else None
                    ))
        
        if changes:
            EnquiryAuditLog.objects.bulk_create(changes)
