import { API_BASE_URL } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { FeedComment, FeedPost, FollowUser, StoryItem } from '@/types/social';

interface BackendPostImage {
  image_url: string;
}

interface BackendPost {
  id: string;
  author_id: string;
  author_username: string;
  author_display_name: string;
  author_avatar_url: string | null;
  caption: string;
  images: BackendPostImage[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
}

interface BackendComment {
  id: string;
  post: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  text: string;
  created_at: string;
}

interface BackendFollow {
  follower_id: string;
  follower_username: string;
  follower_display_name: string;
  follower_avatar_url: string | null;
  following_id: string;
  following_username: string;
  following_display_name: string;
  following_avatar_url: string | null;
}

function defaultAvatar(seed: string) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;
}

export function mapPost(post: BackendPost): FeedPost {
  return {
    id: post.id,
    authorId: post.author_id,
    authorName: post.author_display_name || post.author_username,
    authorAvatar: post.author_avatar_url || defaultAvatar(post.author_id),
    content: post.caption || '',
    imageUrl: post.images[0]?.image_url,
    likes: post.likes_count,
    comments: post.comments_count,
    shares: post.shares_count,
    createdAt: post.created_at,
    isLiked: false,
  };
}

function mapComment(comment: BackendComment): FeedComment {
  return {
    id: comment.id,
    postId: comment.post,
    userId: comment.user_id,
    username: comment.username,
    displayName: comment.display_name || comment.username,
    avatarUrl: comment.avatar_url || defaultAvatar(comment.user_id),
    text: comment.text,
    createdAt: comment.created_at,
  };
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  const token = data.session?.access_token;
  if (!token) {
    throw new Error('No active Supabase session found.');
  }

  return token;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchPosts() {
  const data = await apiRequest<BackendPost[]>('/api/posts/');
  return data.map(mapPost);
}

export async function fetchPostById(postId: string) {
  const data = await apiRequest<BackendPost>(`/api/posts/${postId}/`);
  return mapPost(data);
}

export async function createPost(caption: string) {
  const data = await apiRequest<BackendPost>('/api/posts/', {
    method: 'POST',
    body: JSON.stringify({ caption }),
  });
  return mapPost(data);
}

export async function togglePostLike(postId: string) {
  return apiRequest<{ is_liked: boolean; likes_count: number }>(`/api/posts/${postId}/like/`, {
    method: 'POST',
  });
}

export async function sharePost(postId: string, platform = 'mobile') {
  return apiRequest<{ shares_count: number }>(`/api/posts/${postId}/share/`, {
    method: 'POST',
    body: JSON.stringify({ platform }),
  });
}

export async function fetchPostComments(postId: string) {
  const data = await apiRequest<BackendComment[]>(`/api/posts/${postId}/comments/`);
  return data.map(mapComment);
}

export async function createPostComment(postId: string, text: string) {
  const data = await apiRequest<BackendComment & { comments_count: number }>(`/api/posts/${postId}/comments/`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });

  return {
    comment: mapComment(data),
    commentsCount: data.comments_count,
  };
}

export async function fetchUserProfile(userId: string) {
  return apiRequest<any>(`/api/users/${userId}/`, {
    method: 'GET',
  });
}

export async function fetchUserPosts(userId: string) {
  return apiRequest<BackendPost[]>(`/api/users/${userId}/posts/`, {
    method: 'GET',
  });
}

export async function fetchFollowers(userId: string) {
  return apiRequest<BackendFollow[]>(`/api/follows/${userId}/followers/`);
}

export async function fetchFollowing(userId: string) {
  return apiRequest<BackendFollow[]>(`/api/follows/${userId}/following/`);
}

export async function toggleFollow(userId: string) {
  return apiRequest<{ is_following: boolean }>(`/api/follows/${userId}/toggle/`, {
    method: 'POST',
  });
}

interface BackendNotification {
  id: string;
  recipient: string;
  actor_id: string;
  actor_username: string;
  actor_display_name: string;
  actor_avatar_url: string | null;
  post: string | null;
  notification_type: 'like' | 'comment' | 'share' | 'follow' | 'new_post';
  message: string;
  is_read: boolean;
  created_at: string;
}

import type { SocialNotification } from '@/types/social';

export async function fetchNotifications(): Promise<SocialNotification[]> {
  const data = await apiRequest<BackendNotification[]>('/api/notifications/');
  return data.map((n) => ({
    id: n.id,
    actorId: n.actor_id,
    actorUsername: n.actor_username,
    actorDisplayName: n.actor_display_name || n.actor_username,
    actorAvatar: n.actor_avatar_url || defaultAvatar(n.actor_id),
    postId: n.post,
    type: n.notification_type,
    message: n.message,
    isRead: n.is_read,
    createdAt: n.created_at,
  }));
}

export async function markNotificationRead(notificationId: string) {
  return apiRequest<{ status: string }>(`/api/notifications/${notificationId}/read/`, {
    method: 'POST',
  });
}

export async function markAllNotificationsRead() {
  return apiRequest<{ status: string }>('/api/notifications/read-all/', {
    method: 'POST',
  });
}

import type { Community } from '@/types/social';

interface BackendCommunity {
  id: string;
  name: string;
  description: string;
  members_count: number;
  is_joined: boolean;
  created_at: string;
}

export async function fetchCommunities(): Promise<Community[]> {
  const data = await apiRequest<BackendCommunity[]>('/api/communities/');
  return data.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    membersCount: c.members_count,
    isJoined: c.is_joined,
    createdAt: c.created_at,
  }));
}

export async function fetchJoinedCommunities(): Promise<Community[]> {
  const data = await apiRequest<BackendCommunity[]>('/api/communities/joined/');
  return data.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    membersCount: c.members_count,
    isJoined: c.is_joined,
    createdAt: c.created_at,
  }));
}

export async function createCommunity(name: string, description: string): Promise<Community> {
  const c = await apiRequest<BackendCommunity>('/api/communities/', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    membersCount: c.members_count,
    isJoined: c.is_joined,
    createdAt: c.created_at,
  };
}

export async function toggleJoinCommunity(communityId: string) {
  return apiRequest<{ is_joined: boolean; members_count: number }>(`/api/communities/${communityId}/toggle-join/`, {
    method: 'POST',
  });
}

export function buildStoriesFromPosts(posts: FeedPost[], currentUserName?: string, currentUserAvatar?: string): StoryItem[] {
  const stories: StoryItem[] = [];

  if (currentUserName || currentUserAvatar) {
    stories.push({
      id: 'own-story',
      user: currentUserName || 'You',
      avatar: currentUserAvatar || defaultAvatar('me'),
      hasStory: false,
      isOwn: true,
    });
  }

  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.authorId)) {
      continue;
    }

    seen.add(post.authorId);
    stories.push({
      id: `story-${post.authorId}`,
      user: post.authorName,
      avatar: post.authorAvatar,
      hasStory: true,
    });

    if (stories.length >= 10) {
      break;
    }
  }

  return stories;
}

export function buildPeopleSuggestionsFromFollows(
  followers: BackendFollow[],
  following: BackendFollow[],
  currentUserId: string,
): FollowUser[] {
  const followingIds = new Set(following.map((item) => item.following_id));

  return followers
    .filter((item) => item.follower_id !== currentUserId)
    .map((item) => ({
      id: item.follower_id,
      username: item.follower_username,
      displayName: item.follower_display_name || item.follower_username,
      avatarUrl: item.follower_avatar_url || defaultAvatar(item.follower_id),
      isFollowing: followingIds.has(item.follower_id),
    }))
    .sort((a, b) => Number(a.isFollowing) - Number(b.isFollowing));
}
export async function togglePostBookmark(postId: string) {
  return apiRequest<{ status: string; bookmarked: boolean; id?: number; post?: BackendPost }>(/api/bookmarks/, {
    method: 'POST',
    body: JSON.stringify({ post_id: postId })
  });
}

export async function fetchBookmarks(): Promise<BackendPost[]> {
  const result: any[] = await apiRequest(/api/bookmarks/);
  return result.map(b => b.post);
}

export async function fetchStories(): Promise<any[]> {
  return apiRequest(/api/stories/);
}

export async function uploadStory(data: { text?: string, image_url?: string }): Promise<any> {
  return apiRequest(/api/stories/, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
export async function updatePost(postId: string, text: string): Promise<BackendPost> {
  return apiRequest(/api/posts//, {
    method: 'PATCH',
    body: JSON.stringify({ caption: text })
  });
}

export async function deletePost(postId: string): Promise<void> {
  return apiRequest(/api/posts//, {
    method: 'DELETE'
  });
}
