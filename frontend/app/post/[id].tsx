import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Avatar from '@/components/ui/Avatar';
import { createPostComment, fetchPostById, fetchPostComments, togglePostLike } from '@/lib/socialApi';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/AppTheme';
import type { FeedComment, FeedPost } from '@/types/social';

function formatRelativeTime(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) {
    return 'Just now';
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CommentItem({ comment }: { comment: FeedComment }) {
  return (
    <View style={styles.commentWrap}>
      <Avatar uri={comment.avatarUrl} name={comment.displayName} size={36} />
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentName}>{comment.displayName}</Text>
          <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
      </View>
    </View>
  );
}

export default function PostDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    loadPost(String(id));
  }, [id]);

  async function loadPost(postId: string) {
    try {
      setLoading(true);
      const [postData, commentData] = await Promise.all([
        fetchPostById(postId),
        fetchPostComments(postId),
      ]);
      setPost(postData);
      setLiked(postData.isLiked);
      setLikesCount(postData.likes);
      setComments(commentData);
    } catch {
      setPost(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike() {
    if (!id) return;
    // Optimistic update
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    try {
      const result = await togglePostLike(String(id));
      setLiked(result.is_liked);
      setLikesCount(result.likes_count);
    } catch {
      setLiked(prevLiked);
      setLikesCount(prevCount);
    }
  }

  async function handleSubmitComment() {
    if (!id || !commentText.trim() || submittingComment) {
      return;
    }

    try {
      setSubmittingComment(true);
      const result = await createPostComment(String(id), commentText.trim());
      setComments((prev) => [result.comment, ...prev]);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: result.commentsCount,
            }
          : prev,
      );
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          )}

          {!loading && !post && (
            <View style={styles.loadingWrap}>
              <Text style={styles.mutedText}>Post not found.</Text>
            </View>
          )}

          {!loading && post && (
            <>
              {/* Post preview card */}
              <View style={styles.postPreview}>
                <View style={styles.postPreviewHeader}>
                  <Avatar uri={post.authorAvatar} name={post.authorName} size={40} />
                  <View style={styles.postPreviewInfo}>
                    <Text style={styles.postPreviewName}>{post.authorName}</Text>
                    <Text style={styles.postPreviewTime}>{formatRelativeTime(post.createdAt)}</Text>
                  </View>
                </View>
                {post.content ? (
                  <Text style={styles.postPreviewText}>{post.content}</Text>
                ) : null}
              </View>

              {/* Like section */}
              <View style={styles.likeSection}>
                <TouchableOpacity style={styles.likeBtn} onPress={handleLike} activeOpacity={0.7}>
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={liked ? Colors.like : Colors.text.secondary}
                  />
                  <Text style={[styles.likeBtnText, liked && { color: Colors.like }]}>
                    {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.likeStat}>
                  <Ionicons name="chatbubble-outline" size={18} color={Colors.text.secondary} />
                  <Text style={styles.likeStatText}>{comments.length} Comments</Text>
                </View>
              </View>

              {/* Comments header */}
              <View style={styles.commentsHeader}>
                <Text style={styles.sectionLabel}>Comments</Text>
              </View>

              {/* Comment list */}
              <View style={styles.commentsList}>
                {comments.map(c => (
                  <CommentItem key={c.id} comment={c} />
                ))}
                {comments.length === 0 && (
                  <View style={styles.emptyComments}>
                    <Ionicons name="chatbubble-outline" size={32} color={Colors.text.muted} />
                    <Text style={styles.mutedText}>No comments yet. Be the first!</Text>
                  </View>
                )}
              </View>

              <View style={{ height: 80 }} />
            </>
          )}
        </ScrollView>

        {/* Comment input — clean: just text input + send */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor={Colors.text.muted}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, commentText.trim() && styles.sendBtnActive]}
            disabled={!commentText.trim() || submittingComment}
            onPress={handleSubmitComment}
          >
            {submittingComment ? (
              <ActivityIndicator size={16} color={Colors.primary} />
            ) : (
              <Ionicons
                name="paper-plane"
                size={20}
                color={commentText.trim() ? Colors.primary : Colors.text.muted}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },

  // Post preview
  postPreview: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  postPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  postPreviewInfo: { marginLeft: Spacing.sm },
  postPreviewName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  postPreviewTime: { fontSize: FontSize.xs, color: Colors.text.muted, marginTop: 1 },
  postPreviewText: {
    fontSize: FontSize.base,
    color: Colors.text.primary,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },

  // Like section
  likeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  likeBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  likeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  likeStatText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },

  // Comments
  sectionLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  commentsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  commentsList: { padding: Spacing.base, gap: Spacing.base },
  commentWrap: { flexDirection: 'row', gap: Spacing.sm },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  commentName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  commentTime: { fontSize: FontSize.xs, color: Colors.text.muted },
  commentText: { fontSize: FontSize.base, color: Colors.text.primary, lineHeight: 21 },
  emptyComments: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  mutedText: { fontSize: FontSize.sm, color: Colors.text.muted },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background, gap: Spacing.sm,
  },
  commentInput: {
    flex: 1, minHeight: 38, maxHeight: 100,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs + 2,
    fontSize: FontSize.base, color: Colors.text.primary,
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  sendBtnActive: { backgroundColor: Colors.primaryLight },
  loadingWrap: { alignItems: 'center', padding: Spacing.lg },
});
