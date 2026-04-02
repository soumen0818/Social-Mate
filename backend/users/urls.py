from django.urls import path

from users.views import HealthCheckView, MeView


urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('users/me/', MeView.as_view(), name='users-me'),
]
