import os
import uuid
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import Notification
from posts.models import Comment, Community, CommunityMembership, Like, Post, PostUploadIntent, Share, Story, Bookmark
from posts.serializers import (
    CommentSerializer,
    CommentCreateSerializer,
    CommunitySerializer,
    PostCreateSerializer,
    PostUploadIntentCreateSerializer,
    PostSerializer,
    ShareCreateSerializer,
    StorySerializer,
    BookmarkSerializer,
    POST_UPLOAD_INTENT_TTL_MINUTES,
)


class PostListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Post.objects.select_related('author', 'community').prefetch_related('images', 'likes', 'comments', 'shares')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PostCreateSerializer
        return PostSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        response_serializer = PostSerializer(post, context=self.get_serializer_context())
        return Response(response_serializer.data, status=201)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PostSerializer
    queryset = Post.objects.select_related('author', 'community').prefetch_related('images', 'likes', 'comments', 'shares')
    lookup_field = 'id'


class UserPostListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PostSerializer

    def get_queryset(self):
        return (
            Post.objects.select_related('author', 'community')
            .prefetch_related('images', 'likes', 'comments', 'shares')
            .filter(author_id=self.kwargs['user_id'])
        )


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


class PostUploadUrlsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PostUploadIntentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        base = (settings.SUPABASE_URL or '').rstrip('/')
        if not base:
            return Response({'detail': 'SUPABASE_URL is not configured.'}, status=500)
        expires_at = timezone.now() + timedelta(minutes=POST_UPLOAD_INTENT_TTL_MINUTES)
        uploads = []

        for file_payload in serializer.validated_data['files']:
            ext = os.path.splitext(file_payload['file_name'])[1].lower()
            if not ext:
                ext = '.jpg'

            storage_path = f'{request.user.id}/{uuid.uuid4().hex}{ext}'
            PostUploadIntent.objects.create(
                user=request.user,
                storage_path=storage_path,
                content_type=file_payload['content_type'],
                size_bytes=file_payload['size_bytes'],
                expires_at=expires_at,
            )

            uploads.append(
                {
                    'storage_path': storage_path,
                    'upload_url': f'{base}/storage/v1/object/posts_media/{storage_path}',
                    'public_url': f'{base}/storage/v1/object/public/posts_media/{storage_path}',
                    'content_type': file_payload['content_type'],
                    'max_size_bytes': 1024 * 1024,
                    'expires_at': expires_at,
                }
            )

        return Response({'uploads': uploads}, status=201)


class CommunityListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CommunitySerializer

    def get_queryset(self):
        return Community.objects.prefetch_related('memberships')

    def perform_create(self, serializer):
        community = serializer.save(created_by=self.request.user)
        CommunityMembership.objects.create(community=community, user=self.request.user)


class JoinedCommunityListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CommunitySerializer

    def get_queryset(self):
        return Community.objects.prefetch_related('memberships').filter(memberships__user=self.request.user)


class CommunityToggleJoinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, community_id):
        community = generics.get_object_or_404(Community, id=community_id)
        membership = CommunityMembership.objects.filter(community=community, user=request.user).first()

        if membership:
            membership.delete()
            return Response({'is_joined': False, 'members_count': community.memberships.count()})

        CommunityMembership.objects.create(community=community, user=request.user)
        return Response({'is_joined': True, 'members_count': community.memberships.count()}, status=201)


class CommunityPostListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PostSerializer

    def get_queryset(self):
        community_id = self.kwargs['community_id']
        return (
            Post.objects.select_related('author', 'community')
            .prefetch_related('images', 'likes', 'comments', 'shares')
            .filter(community_id=community_id)
        )


class StoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StorySerializer

    def get_queryset(self):
        from follows.models import Follow
        # Only return stories from people the user follows + their own (like Instagram)
        following_ids = Follow.objects.filter(
            follower=self.request.user
        ).values_list('following_id', flat=True)
        allowed_users = list(following_ids) + [self.request.user.id]
        return (
            Story.objects
            .filter(expires_at__gt=timezone.now(), user_id__in=allowed_users)
            .select_related('user')
        )

    def create(self, request, *args, **kwargs):
        storage_path = request.data.get('storage_path', '')
        text = request.data.get('text', '')
        image_url = request.data.get('image_url', '')

        # If a storage_path was provided (frontend uploaded to Supabase), construct the public URL
        if storage_path:
            base = (settings.SUPABASE_URL or '').rstrip('/')
            image_url = f'{base}/storage/v1/object/public/posts_media/{storage_path}'

        story = Story.objects.create(
            user=request.user,
            storage_path=storage_path,
            image_url=image_url,
            text=text,
        )
        return Response(StorySerializer(story).data, status=201)


class BookmarkListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).select_related('post', 'post__author')

    def post(self, request, *args, **kwargs):
        post_id = request.data.get('post_id')
        if not post_id:
            return Response({'error': 'post_id required'}, status=400)
        try:
            bookmark, created = Bookmark.objects.get_or_create(user=request.user, post_id=post_id)
            if not created:
                bookmark.delete()
                return Response({'status': 'unbookmarked', 'bookmarked': False})
            return Response({'status': 'bookmarked', 'bookmarked': True, **BookmarkSerializer(bookmark).data}, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
