import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
	class NotificationType(models.TextChoices):
		LIKE = 'like', 'Like'
		COMMENT = 'comment', 'Comment'
		SHARE = 'share', 'Share'
		FOLLOW = 'follow', 'Follow'
		NEW_POST = 'new_post', 'New Post'

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	recipient = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name='notifications',
	)
	actor = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name='triggered_notifications',
	)
	post = models.ForeignKey('posts.Post', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
	notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
	message = models.CharField(max_length=255, blank=True)
	is_read = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return f'{self.notification_type} -> {self.recipient_id}'
