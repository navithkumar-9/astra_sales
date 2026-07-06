from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from core.services.user_service import UserService
from core.serializers.user import UserCreateSerializer, UserSerializer

class UserCreationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = UserService.create_user(
                    creator=request.user,
                    username=serializer.validated_data['username'],
                    password=serializer.validated_data['password'],
                    role=serializer.validated_data['role'],
                    name=serializer.validated_data.get('name', '')
                )
                response_serializer = UserSerializer(user)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            "success": True,
            "data": serializer.data
        }, status=status.HTTP_200_OK)
