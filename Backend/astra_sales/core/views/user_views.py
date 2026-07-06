from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from core.services.user_service import UserService
from core.serializers.user import UserCreateSerializer, UserSerializer

class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            users = UserService.list_users(request.user)
            serializer = UserSerializer(users, many=True)
            return Response({
                "success": True,
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_403_FORBIDDEN)

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
                return Response({
                    "success": True,
                    "data": response_serializer.data
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    "success": False,
                    "error": str(e)
                }, status=status.HTTP_403_FORBIDDEN)
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        try:
            user = UserService.update_user(
                requestor=request.user,
                user_id=pk,
                data=request.data
            )
            serializer = UserSerializer(user)
            return Response({
                "success": True,
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            UserService.delete_user(request.user, pk)
            return Response({
                "success": True,
                "message": "User deleted successfully."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            "success": True,
            "data": serializer.data
        }, status=status.HTTP_200_OK)
