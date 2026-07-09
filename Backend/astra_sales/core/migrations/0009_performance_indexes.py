from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_enquiry_actual_date_of_sales_enquiry_sales_remarks'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='enquiry',
            index=models.Index(fields=['-created_at'], name='enq_created_at_desc_idx'),
        ),
        migrations.AddIndex(
            model_name='enquiry',
            index=models.Index(fields=['status'], name='enq_status_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['role', '-date_joined'], name='user_role_joined_idx'),
        ),
    ]
