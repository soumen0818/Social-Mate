from django.conf import settings
from django.utils import timezone
from rest_framework import serializers
from posts.models import Comment, Community, CommunityMembership, Post, PostImage, PostUploadIntent, Share, Story, Bookmark

MAX_POST_IMAGES = 2
MAX_IMAGE_SIZE_BYTES = 1024 * 1024
POST_UPLOAD_INTENT_TTL_MINUTES = 30


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ['id', 'storage_path', 'image_url', 'order']


class PostSerializer(serializers.ModelSerializer):
    author_id = serializers.UUIDField(source='author.id', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_display_name = serializers.CharField(source='author.display_name', read_only=True)
    author_avatar_url = serializers.CharField(source='author.avatar_url', read_only=True)
    community_id = serializers.UUIDField(source='community.id', read_only=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
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
            'community_id',
            'community_name',
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
    uploaded_paths = serializers.ListField(
        child=serializers.CharField(max_length=255),
        required=False,
        allow_empty=True,
    )
    community_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Post
        fields = ['caption', 'uploaded_paths', 'community_id']

    def validate_uploaded_paths(self, value):
        unique_paths = list(dict.fromkeys(value))
        if len(unique_paths) > MAX_POST_IMAGES:
            raise serializers.ValidationError('You can attach up to 2 images per post.')
        return unique_paths

    def validate_community_id(self, value):
        if value is None:
            return None

        request = self.context['request']
        community = Community.objects.filter(id=value).first()
        if not community:
            raise serializers.ValidationError('Invalid community selected.')

        is_member = CommunityMembership.objects.filter(community=community, user=request.user).exists()
        if not is_member:
            raise serializers.ValidationError('Join the community before posting to it.')

        return value

    def validate(self, attrs):
        request = self.context['request']
        uploaded_paths = attrs.get('uploaded_paths', [])
        now = timezone.now()

        intents = []
        if uploaded_paths:
            intents = list(
                PostUploadIntent.objects.filter(
                    user=request.user,
                    storage_path__in=uploaded_paths,
                    used_at__isnull=True,
                    expires_at__gt=now,
                )
            )
            intent_map = {intent.storage_path: intent for intent in intents}
            missing_paths = [path for path in uploaded_paths if path not in intent_map]
            if missing_paths:
                raise serializers.ValidationError({'uploaded_paths': 'Some image uploads are missing or expired.'})

            too_large = [intent.storage_path for intent in intents if intent.size_bytes > MAX_IMAGE_SIZE_BYTES]
            if too_large:
                raise serializers.ValidationError({'uploaded_paths': 'Each image must be 1MB or less.'})

        attrs['_upload_intents'] = intents
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        uploaded_paths = validated_data.pop('uploaded_paths', [])
        community_id = validated_data.pop('community_id', None)
        upload_intents = validated_data.pop('_upload_intents', [])
        community = Community.objects.filter(id=community_id).first() if community_id else None

        post = Post.objects.create(author=request.user, community=community, **validated_data)

        if uploaded_paths:
            base = (settings.SUPABASE_URL or '').rstrip('/')
            for order, path in enumerate(uploaded_paths):
                PostImage.objects.create(
                    post=post,
                    storage_path=path,
                    image_url=f'{base}/storage/v1/object/public/posts_media/{path}' if base else path,
                    order=order,
                )

            now = timezone.now()
            PostUploadIntent.objects.filter(id__in=[intent.id for intent in upload_intents]).update(used_at=now)

        return post


class PostUploadRequestFileSerializer(serializers.Serializer):
    file_name = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=120)
    size_bytes = serializers.IntegerField(min_value=1, max_value=MAX_IMAGE_SIZE_BYTES)

    def validate_content_type(self, value):
        if not value.lower().startswith('image/'):
            raise serializers.ValidationError('Only image uploads are supported.')
        return value


class PostUploadIntentCreateSerializer(serializers.Serializer):
    files = PostUploadRequestFileSerializer(many=True)

    def validate_files(self, value):
        if not value:
            raise serializers.ValidationError('At least one image is required.')
        if len(value) > MAX_POST_IMAGES:
            raise serializers.ValidationError('You can upload up to 2 images per post.')
        return value


class CommunitySerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = ['id', 'name', 'description', 'members_count', 'is_joined', 'created_at']

    def get_members_count(self, obj):
        return obj.memberships.count()

    def get_is_joined(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.memberships.filter(user=request.user).exists()


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
class StorySerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_avatar_url = serializers.CharField(source='user.avatar_url', read_only=True)

    class Meta:
        model = Story
        fields = ['id', 'user_id', 'user_username', 'user_avatar_url', 'image_url', 'storage_path', 'text', 'created_at', 'expires_at']

class BookmarkSerializer(serializers.ModelSerializer):
    post = PostSerializer(read_only=True)
    
    class Meta:
        model = Bookmark
        fields = ['id', 'post', 'created_at']
