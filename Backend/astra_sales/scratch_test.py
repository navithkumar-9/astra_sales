import os
import django
import sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "astra_sales.settings")
django.setup()
from core.serializers.enquiry import EnquirySerializer
from core.models.enquiry import Enquiry

e = Enquiry.objects.first()
if not e:
    print("No Enquiry found in DB.")
    sys.exit(0)

# Custom serializer with file string bypass
class DebugSerializer(EnquirySerializer):
    def to_internal_value(self, data):
        # Prevent mutating the argument if it is a QueryDict
        if hasattr(data, "copy"):
            data = data.copy()
        else:
            data = dict(data)
            
        for field in ["rfq_document", "po_document"]:
            if field in data and isinstance(data[field], str):
                val = data[field]
                if val.startswith("http") or "/media/" in val or (self.instance and getattr(self.instance, field) and val.endswith(getattr(self.instance, field).name)):
                    data.pop(field, None)
        return super().to_internal_value(data)

s = DebugSerializer(e, data={"rfq_document": "http://127.0.0.1/media/documents/rfq/test.pdf"}, partial=True)
print("IS VALID:", s.is_valid())
if not s.is_valid():
    print("ERRORS:", s.errors)
else:
    print("VALIDATED DATA:", s.validated_data)

