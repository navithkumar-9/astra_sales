import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'astra_sales.settings')
django.setup()

from core.models.user import User

users_to_create = [
    {
        'username': 'superadmin',
        'role': 'SUPERADMIN',
        'name': 'Super Admin User',
        'is_staff': True,
        'is_superuser': True
    },
    {
        'username': 'admin',
        'role': 'ADMIN',
        'name': 'Admin User',
        'is_staff': True,
        'is_superuser': False
    },
    {
        'username': 'salesrep',
        'role': 'SALES_REP',
        'name': 'Sales Representative',
        'is_staff': False,
        'is_superuser': False
    },
    {
        'username': 'rfqtracker',
        'role': 'RFQ_TRACKER',
        'name': 'RFQ Tracker',
        'is_staff': False,
        'is_superuser': False
    }
]

created_users = []
for u_data in users_to_create:
    user, created = User.objects.get_or_create(
        username=u_data['username'],
        defaults={
            'role': u_data['role'],
            'name': u_data['name'],
            'is_staff': u_data['is_staff'],
            'is_superuser': u_data['is_superuser']
        }
    )
    if created:
        user.set_password('password123')
        user.save()
        created_users.append(user.username)
        print(f"Created user: {user.username} with role {user.role}")
    else:
        print(f"User {user.username} already exists.")

print("Finished creating users.")
