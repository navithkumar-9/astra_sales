from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from core.metrics import record_login_attempt

class AuthService:
    @staticmethod
    def login(username, password):
        user = authenticate(username=username, password=password)
        if not user:
            record_login_attempt(False)
            return None, "Invalid credentials"
        
        if not user.is_active:
            record_login_attempt(False)
            return None, "User is inactive"

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        record_login_attempt(True)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'name': user.name,
            }
        }, None
