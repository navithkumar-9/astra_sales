from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.metrics import register_collectors
register_collectors()

from core.views.auth_views import LoginView
from core.views.user_views import UserListView, UserDetailView, ProfileView
from core.views.master_data_views import (
    SBUViewSet,
    DivisionViewSet,
    FGViewSet,
    RFQViewSet,
    CustomerViewSet,
    MailViewSet,
)
from core.views.enquiry_views import EnquiryViewSet

router = DefaultRouter()
router.register('sbus', SBUViewSet, basename='sbu')
router.register('divisions', DivisionViewSet, basename='division')
router.register('fgs', FGViewSet, basename='fg')
router.register('rfqs', RFQViewSet, basename='rfq')
router.register('customers', CustomerViewSet, basename='customer')
router.register('mails', MailViewSet, basename='mail')
router.register('enquiries', EnquiryViewSet, basename='enquiry')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('users/', UserListView.as_view(), name='users_list_create'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='users_detail'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('', include(router.urls)),
]
