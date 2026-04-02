from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from follows.models import Follow
from follows.serializers import FollowSerializer
from notifications.models import Notification

User = get_user_model()


class FollowToggleView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, user_id):
		if str(request.user.id) == str(user_id):
			return Response({'detail': 'You cannot follow yourself.'}, status=400)

		target_user = generics.get_object_or_404(User, id=user_id)
		follow_relation = Follow.objects.filter(follower=request.user, following=target_user).first()

		if follow_relation:
			follow_relation.delete()
			return Response({'is_following': False})

		Follow.objects.create(follower=request.user, following=target_user)

		Notification.objects.create(
			recipient=target_user,
			actor=request.user,
			notification_type=Notification.NotificationType.FOLLOW,
			message=f'{request.user.username} started following you.',
		)

		return Response({'is_following': True}, status=201)


class FollowersListView(generics.ListAPIView):
	permission_classes = [IsAuthenticated]
	serializer_class = FollowSerializer

	def get_queryset(self):
		user_id = self.kwargs['user_id']
		return Follow.objects.select_related('follower', 'following').filter(following_id=user_id)


class FollowingListView(generics.ListAPIView):
	permission_classes = [IsAuthenticated]
	serializer_class = FollowSerializer

	def get_queryset(self):
		user_id = self.kwargs['user_id']
		return Follow.objects.select_related('follower', 'following').filter(follower_id=user_id)
