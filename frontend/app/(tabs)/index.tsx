import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Logo from '@/components/shared/Logo';
import CreatePostBar from '@/components/home/CreatePostBar';
import StoryBar from '@/components/home/StoryBar';
import PostCard from '@/components/home/PostCard';
import { useAuth } from '@/context/AuthContext';
import { fetchPosts, fetchStories, sharePost, togglePostLike } from '@/lib/socialApi';
import { Colors } from '@/constants/Colors';
import { FontSize, Spacing } from '@/constants/AppTheme';
import type { FeedPost, StoryItem } from '@/types/social';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadStories = useCallback(async () => {
    try {
      const raw = await fetchStories();
      // Map backend story format to StoryItem, put current user first
      const mapped: StoryItem[] = raw.map((s: any) => ({
        id: s.id,
        user: s.user_username || 'User',
        avatar: s.user_avatar_url || '',
        hasStory: true,
      }));

      // Always prepend the current user's "Your Story" slot
      const ownStory: StoryItem = {
        id: 'own-story',
        user: user?.name || 'You',
        avatar: user?.avatar || '',
        hasStory: false,
        isOwn: true,
      };
      setStories([ownStory, ...mapped]);
    } catch {
      // Even on failure, keep the user's own story slot
      setStories([{
        id: 'own-story',
        user: user?.name || 'You',
        avatar: user?.avatar || '',
        hasStory: false,
        isOwn: true,
      }]);
    }
  }, [user?.name, user?.avatar]);

  async function loadFeed() {
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadFeed(), loadStories()]);
    setRefreshing(false);
  }

  async function handleLike(postId: string) {
    const result = await togglePostLike(postId);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: result.is_liked,
              likes: result.likes_count,
            }
          : post,
      ),
    );

    return {
      isLiked: result.is_liked,
      likesCount: result.likes_count,
    };
  }

  async function handleShare(postId: string) {
    const result = await sharePost(postId);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              shares: result.shares_count,
            }
          : post,
      ),
    );

    return { sharesCount: result.shares_count };
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Logo size="sm" />
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(tabs)/notifications')}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text.primary} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Create Post */}
        <View style={{ paddingTop: Spacing.md }}>
          <CreatePostBar user={user} />
        </View>

        {/* Stories */}
        <View style={styles.section}>
          <StoryBar stories={stories} onStoryUploaded={loadStories} />
        </View>

        {/* Feed */}
        <View style={{ paddingTop: Spacing.sm }}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No posts yet.</Text>
            </View>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} onShare={handleShare} />
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerActions: { flexDirection: 'row', gap: Spacing.xs },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.like,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  section: {
    backgroundColor: Colors.background,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
  },
});
