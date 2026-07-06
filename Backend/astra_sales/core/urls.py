from django.urls import path
from core.views.auth_views import LoginView
from core.views.user_views import UserCreationView, ProfileView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('users/', UserCreationView.as_view(), name='create_user'),
    path('profile/', ProfileView.as_view(), name='profile'),
]
