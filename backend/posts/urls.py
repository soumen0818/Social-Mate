from django.urls import path

from posts.views import (
    PostCommentListCreateView,
    PostDetailView,
    PostLikeToggleView,
    PostListCreateView,
    PostShareCreateView,
)


urlpatterns = [
    path('posts/', PostListCreateView.as_view(), name='posts-list-create'),
    path('posts/<uuid:id>/', PostDetailView.as_view(), name='posts-detail'),
    path('posts/<uuid:post_id>/like/', PostLikeToggleView.as_view(), name='posts-like-toggle'),
    path('posts/<uuid:post_id>/comments/', PostCommentListCreateView.as_view(), name='posts-comment-list-create'),
    path('posts/<uuid:post_id>/share/', PostShareCreateView.as_view(), name='posts-share-create'),
]
