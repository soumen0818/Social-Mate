from django.urls import path

from follows.views import FollowersListView, FollowingListView, FollowToggleView


urlpatterns = [
    path('follows/<uuid:user_id>/toggle/', FollowToggleView.as_view(), name='follow-toggle'),
    path('follows/<uuid:user_id>/followers/', FollowersListView.as_view(), name='followers-list'),
    path('follows/<uuid:user_id>/following/', FollowingListView.as_view(), name='following-list'),
]
