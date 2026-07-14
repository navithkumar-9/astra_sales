from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0016_restore_performance_indexes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='enquiry',
            name='customer',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='enquiries', to='core.customer'),
        ),
        migrations.AlterField(
            model_name='enquiry',
            name='division',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='enquiries', to='core.division'),
        ),
        migrations.AlterField(
            model_name='enquiry',
            name='fg_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='enquiries', to='core.fg'),
        ),
        migrations.AlterField(
            model_name='enquiry',
            name='rfq_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='enquiries', to='core.rfq'),
        ),
        migrations.AlterField(
            model_name='enquiry',
            name='sales_rep',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='assigned_enquiries', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='enquiry',
            name='sbu',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='enquiries', to='core.sbu'),
        ),
    ]
