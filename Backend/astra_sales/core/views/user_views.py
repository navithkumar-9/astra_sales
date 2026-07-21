from rest_framework import status, permissions
from rest_framework.views import APIView
from core.services.user_service import UserService
from core.serializers.user import (
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from core.response import success_response, error_response
from core.pagination import CustomPagination


class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            search = request.query_params.get("search")
            role = request.query_params.get("role")
            is_active = request.query_params.get("is_active")
            ordering = request.query_params.get("ordering")

            is_active_val = None
            if is_active is not None:
                if is_active.lower() == "true":
                    is_active_val = True
                elif is_active.lower() == "false":
                    is_active_val = False

            users = UserService.list_users(
                requestor=request.user,
                search=search,
                role=role,
                is_active=is_active_val,
                ordering=ordering,
            )
            paginator = CustomPagination()
            page = paginator.paginate_queryset(users, request)
            if page is not None:
                serializer = UserSerializer(page, many=True)
                return paginator.get_paginated_response(serializer.data)

            serializer = UserSerializer(users, many=True)
            return success_response(
                data=serializer.data, message="Users list retrieved successfully."
            )
        except Exception as e:
            return error_response(message=str(e), status_code=status.HTTP_403_FORBIDDEN)

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = UserService.create_user(
                    creator=request.user,
                    username=serializer.validated_data["username"],
                    password=serializer.validated_data["password"],
                    role=serializer.validated_data["role"],
                    name=serializer.validated_data.get("name", ""),
                )
                response_serializer = UserSerializer(user)
                return success_response(
                    data=response_serializer.data,
                    message="User created successfully.",
                    status_code=status.HTTP_201_CREATED,
                )
            except Exception as e:
                return error_response(
                    message=str(e), status_code=status.HTTP_403_FORBIDDEN
                )
        return error_response(
            message="Invalid data provided.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        serializer = UserUpdateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = UserService.update_user(
                    requestor=request.user, user_id=pk, data=serializer.validated_data
                )
                response_serializer = UserSerializer(user)
                return success_response(
                    data=response_serializer.data, message="User updated successfully."
                )
            except Exception as e:
                return error_response(
                    message=str(e), status_code=status.HTTP_400_BAD_REQUEST
                )
        return error_response(
            message="Invalid data provided.",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        try:
            UserService.delete_user(request.user, pk)
            return success_response(message="User deleted successfully.")
        except Exception as e:
            return error_response(
                message=str(e), status_code=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return success_response(
            data=serializer.data, message="Profile retrieved successfully."
        )
