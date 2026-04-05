import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Avatar from '@/components/ui/Avatar';
import { createPostComment, fetchPostById, fetchPostComments } from '@/lib/socialApi';
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
        <Text style={styles.commentName}>{comment.displayName}</Text>
        <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
        <Text style={styles.commentText}>{comment.text}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction}>
            <Text style={styles.commentActionText}>like</Text>
          </TouchableOpacity>
        </View>
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
      setComments(commentData);
    } catch {
      setPost(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  const likeAvatars = useMemo(() => comments.slice(0, 5).map((item) => item.avatarUrl), [comments]);

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
              <Text style={styles.sortText}>Post not found.</Text>
            </View>
          )}

          {!loading && post && (
            <>
          {/* Likes section */}
          <View style={styles.likesSection}>
            <Text style={styles.sectionLabel}>Like</Text>
            <View style={styles.likeAvatars}>
              {likeAvatars.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={[styles.likeAvatar, { marginLeft: i > 0 ? -8 : 0 }]}
                />
              ))}
              <View style={styles.likeExtraWrap}>
                <Text style={styles.likeExtra}>+{post.likes > 5 ? post.likes - 5 : 0}</Text>
              </View>
            </View>
          </View>

          {/* Comments header */}
          <View style={styles.commentsHeader}>
            <Text style={styles.sectionLabel}>Comments</Text>
            <TouchableOpacity style={styles.sortBtn}>
              <Text style={styles.sortText}>Most Recent</Text>
              <Ionicons name="swap-vertical-outline" size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Comment list */}
          <View style={styles.commentsList}>
            {comments.map(c => (
              <CommentItem key={c.id} comment={c} />
            ))}
            {comments.length === 0 && <Text style={styles.sortText}>No comments yet.</Text>}
          </View>

          <View style={{ height: 80 }} />
            </>
          )}
        </ScrollView>

        {/* Comment input */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
          <TouchableOpacity style={styles.inputBarAction}>
            <Ionicons name="attach-outline" size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputBarAction}>
            <Ionicons name="happy-outline" size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor={Colors.text.muted}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, commentText && styles.sendBtnActive]}
            disabled={!commentText || submittingComment}
            onPress={handleSubmitComment}
          >
            <Ionicons
              name="paper-plane"
              size={20}
              color={commentText ? Colors.primary : Colors.text.muted}
            />
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
  likesSection: { padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary, marginBottom: Spacing.sm },
  likeAvatars: { flexDirection: 'row', alignItems: 'center' },
  likeAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.background },
  likeExtraWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginLeft: -8, borderWidth: 2, borderColor: Colors.background,
  },
  likeExtra: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },
  commentsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sortText: { fontSize: FontSize.sm, color: Colors.text.secondary },
  commentsList: { padding: Spacing.base, gap: Spacing.base },
  commentWrap: { flexDirection: 'row', gap: Spacing.sm },
  commentBody: { flex: 1 },
  commentName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  commentTime: { fontSize: FontSize.xs, color: Colors.text.muted, marginBottom: Spacing.xs },
  commentText: { fontSize: FontSize.base, color: Colors.text.primary, lineHeight: 21, marginBottom: Spacing.xs },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  commentAction: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  commentActionText: { fontSize: FontSize.xs, color: Colors.text.secondary, fontWeight: FontWeight.medium },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background, gap: Spacing.xs,
  },
  inputBarAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  commentInput: {
    flex: 1, minHeight: 38, maxHeight: 100,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs + 2,
    fontSize: FontSize.base, color: Colors.text.primary,
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: {},
  loadingWrap: { alignItems: 'center', padding: Spacing.lg },
});
