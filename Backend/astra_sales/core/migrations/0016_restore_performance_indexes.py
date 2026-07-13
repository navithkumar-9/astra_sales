from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_activity'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='enquiry',
            index=models.Index(fields=['-created_at'], name='enq_created_at_desc_idx'),
        ),
        migrations.AddIndex(
            model_name='enquiry',
            index=models.Index(fields=['status', '-created_at'], name='enq_status_created_idx'),
        ),
        migrations.AddIndex(
            model_name='enquiry',
            index=models.Index(fields=['rfq_date'], name='enq_rfq_date_idx'),
        ),
        migrations.AddIndex(
            model_name='enquiry',
            index=models.Index(fields=['rfq_due_date'], name='enq_rfq_due_date_idx'),
        ),
        migrations.AddIndex(
            model_name='enquiry',
            index=models.Index(fields=['quote_date'], name='enq_quote_date_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['role', '-date_joined'], name='user_role_joined_idx'),
        ),
    ]
