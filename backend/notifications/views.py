from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import Notification
from notifications.serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
	permission_classes = [IsAuthenticated]
	serializer_class = NotificationSerializer

	def get_queryset(self):
		return Notification.objects.select_related('actor').filter(recipient=self.request.user)


class NotificationMarkReadView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, notification_id):
		notification = generics.get_object_or_404(Notification, id=notification_id, recipient=request.user)
		notification.is_read = True
		notification.save(update_fields=['is_read'])
		return Response({'status': 'read'})


class NotificationMarkAllReadView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
		return Response({'status': 'all_read'})
