from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_id = serializers.UUIDField(source='actor.id', read_only=True)
    actor_username = serializers.CharField(source='actor.username', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient',
            'actor_id',
            'actor_username',
            'post',
            'notification_type',
            'message',
            'is_read',
            'created_at',
        ]
        read_only_fields = fields
