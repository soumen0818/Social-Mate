from django.urls import path

from notifications.views import NotificationListView, NotificationMarkAllReadView, NotificationMarkReadView


urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notifications-list'),
    path('notifications/<uuid:notification_id>/read/', NotificationMarkReadView.as_view(), name='notification-read'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notifications-read-all'),
]
