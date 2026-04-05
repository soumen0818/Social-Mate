import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchBookmarks, togglePostLike, mapPost } from '@/lib/socialApi';
import type { FeedPost } from '@/types/social';
import PostCard from '@/components/home/PostCard';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight, Spacing } from '@/constants/AppTheme';

export default function BookmarksScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<FeedPost[]>([]);

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const p = await fetchBookmarks();
      setPosts(p?.map(mapPost) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  async function handleLike(postId: string) {
    const result = await togglePostLike(postId);
    setPosts(prev => prev.map(post => post.id === postId ? { ...post, isLiked: result.is_liked, likes: result.likes_count } : post));
    return { isLiked: result.is_liked, likesCount: result.likes_count };
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Bookmarks</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : posts.length === 0 ? (
          <Text style={styles.empty}>No bookmarked posts found.</Text>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} onLike={handleLike} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  scroll: { paddingBottom: Spacing.xxl },
  empty: { textAlign: 'center', color: Colors.text.muted, marginTop: Spacing.xl, fontSize: FontSize.base },
});
