export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isLiked: boolean;
}

export interface FeedComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  text: string;
  createdAt: string;
}

export interface FollowUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isFollowing: boolean;
}

export interface StoryItem {
  id: string;
  user: string;
  avatar: string;
  hasStory: boolean;
  isOwn?: boolean;
}

export type NotificationType = 'like' | 'comment' | 'share' | 'follow' | 'new_post';

export interface SocialNotification {
  id: string;
  actorId: string;
  actorUsername: string;
  actorDisplayName: string;
  actorAvatar: string;
  postId?: string | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  isJoined: boolean;
  createdAt: string;
}
