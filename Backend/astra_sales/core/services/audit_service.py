from core.models.audit import EnquiryAuditLog

class AuditService:
    @staticmethod
    def log_enquiry_changes(instance, validated_data, user=None):
        audit_fields = [
            'status', 'project_name', 'rfq_no', 'rfq_date', 'rfq_due_date', 'rfq_due_time',
            'customer', 'sbu', 'division', 'rfq_type', 'fg_type', 'sales_rep',
            'quote_value', 'po_value', 'open_l1_value', 'lost_value',
            'ed_of_engg', 'actual_date_of_engg', 'engg_remarks',
            'ed_of_costing', 'actual_date_of_costing', 'costing_remarks',
            'ed_of_sales', 'actual_date_of_sales', 'sales_remarks',
            'remarks', 'clarification_to_cs', 'clarification_from_cs',
            'quote_date', 'open_l1_date', 'po_no', 'po_receipt_date'
        ]
        changes = []
        for field in audit_fields:
            if field in validated_data:
                old_val = getattr(instance, field)
                new_val = validated_data[field]
                
                # Check for string representation equivalence (especially for FKs)
                old_str = str(old_val) if old_val is not None else None
                new_str = str(new_val) if new_val is not None else None
                
                # Special check for FK fields which might be objects or IDs in new_val
                if hasattr(old_val, 'id'):
                    old_str = str(old_val.id)
                if hasattr(new_val, 'id'):
                    new_str = str(new_val.id)
                elif hasattr(new_val, 'pk'):
                    new_str = str(new_val.pk)

                if old_str != new_str:
                    changes.append(EnquiryAuditLog(
                        enquiry=instance,
                        user=user,
                        field_name=field,
                        old_value=old_str,
                        new_value=new_str
                    ))
        
        if changes:
            EnquiryAuditLog.objects.bulk_create(changes)
