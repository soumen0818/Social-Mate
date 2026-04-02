from rest_framework import serializers
from posts.models import Comment, Post, PostImage, Share


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ['id', 'storage_path', 'image_url', 'order']


class PostSerializer(serializers.ModelSerializer):
    author_id = serializers.UUIDField(source='author.id', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_display_name = serializers.CharField(source='author.display_name', read_only=True)
    author_avatar_url = serializers.CharField(source='author.avatar_url', read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    shares_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
            'author_id',
            'author_username',
            'author_display_name',
            'author_avatar_url',
            'caption',
            'images',
            'likes_count',
            'comments_count',
            'shares_count',
            'created_at',
            'updated_at',
        ]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_shares_count(self, obj):
        return obj.shares.count()


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['caption']

    def create(self, validated_data):
        request = self.context['request']
        return Post.objects.create(author=request.user, **validated_data)


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['text']


class CommentSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.CharField(source='user.display_name', read_only=True)
    avatar_url = serializers.CharField(source='user.avatar_url', read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id',
            'post',
            'user_id',
            'username',
            'display_name',
            'avatar_url',
            'text',
            'created_at',
            'updated_at',
        ]


class ShareCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Share
        fields = ['platform']
