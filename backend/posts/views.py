from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import Notification
from posts.models import Comment, Like, Post, Share
from posts.serializers import (
	CommentSerializer,
	CommentCreateSerializer,
	PostCreateSerializer,
	PostSerializer,
	ShareCreateSerializer,
)


class PostListCreateView(generics.ListCreateAPIView):
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		return Post.objects.select_related('author').prefetch_related('images', 'likes', 'comments', 'shares')

	def get_serializer_class(self):
		if self.request.method == 'POST':
			return PostCreateSerializer
		return PostSerializer

	def get_serializer_context(self):
		context = super().get_serializer_context()
		context['request'] = self.request
		return context


class PostDetailView(generics.RetrieveAPIView):
	permission_classes = [IsAuthenticated]
	serializer_class = PostSerializer
	queryset = Post.objects.select_related('author').prefetch_related('images', 'likes', 'comments', 'shares')
	lookup_field = 'id'


class PostLikeToggleView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, post_id):
		post = generics.get_object_or_404(Post, id=post_id)
		like = Like.objects.filter(post=post, user=request.user).first()

		if like:
			like.delete()
			return Response({'is_liked': False, 'likes_count': post.likes.count()})

		Like.objects.create(post=post, user=request.user)

		if post.author_id != request.user.id:
			Notification.objects.create(
				recipient=post.author,
				actor=request.user,
				post=post,
				notification_type=Notification.NotificationType.LIKE,
				message=f'{request.user.username} liked your post.',
			)

		return Response({'is_liked': True, 'likes_count': post.likes.count()}, status=201)


class PostCommentListCreateView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, post_id):
		post = generics.get_object_or_404(Post, id=post_id)
		comments = Comment.objects.select_related('user').filter(post=post).order_by('-created_at')
		serializer = CommentSerializer(comments, many=True)
		return Response(serializer.data)

	def post(self, request, post_id):
		post = generics.get_object_or_404(Post, id=post_id)
		serializer = CommentCreateSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		comment = Comment.objects.create(
			post=post,
			user=request.user,
			text=serializer.validated_data['text'],
		)

		if post.author_id != request.user.id:
			Notification.objects.create(
				recipient=post.author,
				actor=request.user,
				post=post,
				notification_type=Notification.NotificationType.COMMENT,
				message=f'{request.user.username} commented on your post.',
			)

		comment_payload = CommentSerializer(comment).data
		comment_payload['comments_count'] = post.comments.count()
		return Response(comment_payload, status=201)


class PostShareCreateView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, post_id):
		post = generics.get_object_or_404(Post, id=post_id)
		serializer = ShareCreateSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		Share.objects.create(
			post=post,
			user=request.user,
			platform=serializer.validated_data.get('platform', ''),
		)

		if post.author_id != request.user.id:
			Notification.objects.create(
				recipient=post.author,
				actor=request.user,
				post=post,
				notification_type=Notification.NotificationType.SHARE,
				message=f'{request.user.username} shared your post.',
			)

		return Response({'shares_count': post.shares.count()}, status=201)
