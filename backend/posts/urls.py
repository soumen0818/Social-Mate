from django.urls import path

from posts.views import (
    StoryListCreateView,
    BookmarkListCreateView,
    CommunityListView,
    CommunityPostListView,
    CommunityToggleJoinView,
    JoinedCommunityListView,
    PostCommentListCreateView,
    PostDetailView,
    PostLikeToggleView,
    PostListCreateView,
    PostShareCreateView,
    PostUploadUrlsView,
    UserPostListView,
)


urlpatterns = [
    path('posts/', PostListCreateView.as_view(), name='posts-list-create'),
    path('posts/upload-urls/', PostUploadUrlsView.as_view(), name='posts-upload-urls'),
    path('posts/<uuid:id>/', PostDetailView.as_view(), name='posts-detail'),
    path('users/<uuid:user_id>/posts/', UserPostListView.as_view(), name='users-post-list'),
    path('posts/<uuid:post_id>/like/', PostLikeToggleView.as_view(), name='posts-like-toggle'),
    path('posts/<uuid:post_id>/comments/', PostCommentListCreateView.as_view(), name='posts-comment-list-create'),
    path('posts/<uuid:post_id>/share/', PostShareCreateView.as_view(), name='posts-share-create'),
    path('communities/', CommunityListView.as_view(), name='communities-list'),
    path('communities/joined/', JoinedCommunityListView.as_view(), name='communities-joined-list'),
    path('communities/<uuid:community_id>/toggle-join/', CommunityToggleJoinView.as_view(), name='communities-toggle-join'),
    path('communities/<uuid:community_id>/posts/', CommunityPostListView.as_view(), name='communities-post-list'),
    path('stories/', StoryListCreateView.as_view(), name='stories-list-create'),
    path('bookmarks/', BookmarkListCreateView.as_view(), name='bookmarks-list-create'),
]
