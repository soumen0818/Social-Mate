from django.urls import path

from users.views import HealthCheckView, MeView, UserDetailView, UserListView


urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('users/me/', MeView.as_view(), name='users-me'),
    path('users/', UserListView.as_view(), name='users-list'),
    path('users/<uuid:id>/', UserDetailView.as_view(), name='users-detail'),
]
