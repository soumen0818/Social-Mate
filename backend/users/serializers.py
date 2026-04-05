from rest_framework import serializers
from follows.models import Follow
from users.models import User


class UserMeSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    photos_count = serializers.SerializerMethodField()
    website = serializers.URLField(allow_blank=True, allow_null=True, required=False)
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'display_name',
            'bio',
            'avatar_url',
            'gender',
            'website',
            'followers_count',
            'following_count',
            'posts_count',
            'photos_count',
            'is_following',
            'created_at',
            'updated_at',
        ]

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False

    def get_followers_count(self, obj):
        return Follow.objects.filter(following=obj).count()

    def get_following_count(self, obj):
        return Follow.objects.filter(follower=obj).count()

    def get_posts_count(self, obj):
        return obj.posts.count()

    def get_photos_count(self, obj):
        from posts.models import PostImage
        return PostImage.objects.filter(post__author=obj).count()
