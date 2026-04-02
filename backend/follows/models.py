import uuid

from django.conf import settings
from django.db import models


class Follow(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	follower = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name='following_relations',
	)
	following = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name='follower_relations',
	)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(fields=['follower', 'following'], name='unique_follow_pair'),
			models.CheckConstraint(check=~models.Q(follower=models.F('following')), name='no_self_follow'),
		]
		ordering = ['-created_at']

	def __str__(self):
		return f'{self.follower_id} follows {self.following_id}'
