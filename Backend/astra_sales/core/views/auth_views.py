from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from core.services.auth_service import AuthService

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get("username") or request.data.get("user_name")
        password = request.data.get("password")
        
        if not username or not password:
            return Response({"error": "Username and password required."}, status=status.HTTP_400_BAD_REQUEST)
            
        data, error = AuthService.login(username, password)
        if error:
            return Response({"error": error}, status=status.HTTP_401_UNAUTHORIZED)
            
        return Response({
            "success": True,
            "data": {
                "role": data["user"]["role"],
                "tokens": {
                    "access": data["access"],
                    "refresh": data["refresh"]
                },
                "user": data["user"]
            }
        }, status=status.HTTP_200_OK)
