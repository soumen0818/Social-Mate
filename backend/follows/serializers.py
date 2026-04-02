from rest_framework import serializers

from follows.models import Follow


class FollowSerializer(serializers.ModelSerializer):
    follower_id = serializers.UUIDField(source='follower.id', read_only=True)
    follower_username = serializers.CharField(source='follower.username', read_only=True)
    follower_display_name = serializers.CharField(source='follower.display_name', read_only=True)
    follower_avatar_url = serializers.CharField(source='follower.avatar_url', read_only=True)
    following_id = serializers.UUIDField(source='following.id', read_only=True)
    following_username = serializers.CharField(source='following.username', read_only=True)
    following_display_name = serializers.CharField(source='following.display_name', read_only=True)
    following_avatar_url = serializers.CharField(source='following.avatar_url', read_only=True)

    class Meta:
        model = Follow
        fields = [
            'id',
            'follower_id',
            'follower_username',
            'follower_display_name',
            'follower_avatar_url',
            'following_id',
            'following_username',
            'following_display_name',
            'following_avatar_url',
            'created_at',
        ]
