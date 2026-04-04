import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from posts.models import Community, CommunityMembership, Post, PostUploadIntent

User = get_user_model()


@override_settings(SUPABASE_URL='https://example.supabase.co')
class PostUploadAndCommunityTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(id=uuid.uuid4(), username='alice', email='alice@example.com')
		self.other_user = User.objects.create_user(id=uuid.uuid4(), username='bob', email='bob@example.com')
		self.community = Community.objects.create(name='React Native Devs', description='Mobile builders')
		self.client.force_authenticate(user=self.user)

	def test_upload_urls_reject_more_than_two_files(self):
		response = self.client.post(
			reverse('posts-upload-urls'),
			{
				'files': [
					{'file_name': 'a.jpg', 'content_type': 'image/jpeg', 'size_bytes': 1200},
					{'file_name': 'b.jpg', 'content_type': 'image/jpeg', 'size_bytes': 1200},
					{'file_name': 'c.jpg', 'content_type': 'image/jpeg', 'size_bytes': 1200},
				]
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_upload_urls_reject_non_image_content_type(self):
		response = self.client.post(
			reverse('posts-upload-urls'),
			{
				'files': [
					{'file_name': 'a.mp4', 'content_type': 'video/mp4', 'size_bytes': 1200},
				]
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_create_post_requires_community_membership(self):
		response = self.client.post(
			reverse('posts-list-create'),
			{'caption': 'hello', 'community_id': str(self.community.id)},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_create_post_with_upload_intents(self):
		CommunityMembership.objects.create(community=self.community, user=self.user)
		intent = PostUploadIntent.objects.create(
			user=self.user,
			storage_path=f'{self.user.id}/img-1.jpg',
			content_type='image/jpeg',
			size_bytes=50_000,
			expires_at=timezone.now() + timedelta(hours=1),
		)

		response = self.client.post(
			reverse('posts-list-create'),
			{
				'caption': 'post in community',
				'community_id': str(self.community.id),
				'uploaded_paths': [intent.storage_path],
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		post = Post.objects.get(id=response.data['id'])
		self.assertEqual(post.community_id, self.community.id)
		self.assertEqual(post.images.count(), 1)
		intent.refresh_from_db()
		self.assertIsNotNone(intent.used_at)

	def test_community_join_toggle(self):
		join_response = self.client.post(reverse('communities-toggle-join', kwargs={'community_id': self.community.id}))
		self.assertEqual(join_response.status_code, status.HTTP_201_CREATED)

		leave_response = self.client.post(reverse('communities-toggle-join', kwargs={'community_id': self.community.id}))
		self.assertEqual(leave_response.status_code, status.HTTP_200_OK)
