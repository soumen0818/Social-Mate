from rest_framework import serializers
from follows.models import Follow
from users.models import User


class UserMeSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'display_name',
            'bio',
            'avatar_url',
            'followers_count',
            'following_count',
            'posts_count',
            'created_at',
            'updated_at',
        ]

    def get_followers_count(self, obj):
        return Follow.objects.filter(following=obj).count()

    def get_following_count(self, obj):
        return Follow.objects.filter(follower=obj).count()

    def get_posts_count(self, obj):
        return obj.posts.count()
