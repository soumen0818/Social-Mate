import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Alert,
  ScrollView, Modal, Dimensions, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/ui/Avatar';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/AppTheme';
import type { FeedPost } from '@/types/social';
import { togglePostBookmark, deletePost, getSignedImageUrl } from '@/lib/socialApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Renders a post image with automatic signed-URL fallback for private Storage buckets */
function PostImage({ uri, onPress }: { uri: string; onPress?: () => void }) {
  const [currentUri, setCurrentUri] = useState(uri);
  const [failed, setFailed] = useState(false);
  const [triedSigned, setTriedSigned] = useState(false);

  useEffect(() => {
    setCurrentUri(uri);
    setFailed(false);
    setTriedSigned(false);
  }, [uri]);

  const handleError = async () => {
    if (!triedSigned) {
      const match = uri.match(/posts_media\/(.+?)(\?|$)/);
      if (match) {
        setTriedSigned(true);
        const signedUrl = await getSignedImageUrl(match[1]);
        if (signedUrl) {
          setCurrentUri(signedUrl);
          return;
        }
      }
      setFailed(true);
    } else {
      setFailed(true);
    }
  };

  if (failed || !currentUri) return null;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Image
        source={{ uri: currentUri }}
        style={styles.postImage}
        resizeMode="cover"
        onError={handleError}
      />
    </TouchableOpacity>
  );
}

/** Full-screen image zoom modal */
function ImageZoomModal({ visible, uri, onClose }: { visible: boolean; uri: string; onClose: () => void }) {
  const [currentUri, setCurrentUri] = useState(uri);
  const [triedSigned, setTriedSigned] = useState(false);

  useEffect(() => {
    setCurrentUri(uri);
    setTriedSigned(false);
  }, [uri]);

  const handleError = async () => {
    if (!triedSigned) {
      const match = uri.match(/posts_media\/(.+?)(\?|$)/);
      if (match) {
        setTriedSigned(true);
        const signedUrl = await getSignedImageUrl(match[1]);
        if (signedUrl) {
          setCurrentUri(signedUrl);
          return;
        }
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.zoomOverlay} onPress={onClose}>
        <TouchableOpacity style={styles.zoomCloseBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Image
          source={{ uri: currentUri }}
          style={styles.zoomImage}
          resizeMode="contain"
          onError={handleError}
        />
      </Pressable>
    </Modal>
  );
}

interface PostCardProps {
  post: FeedPost;
  onLike?: (id: string) => Promise<{ isLiked: boolean; likesCount: number } | void>;
  onShare?: (id: string) => Promise<{ sharesCount: number } | void>;
  onBookmark?: (id: string) => void;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function PostCard({ post, onLike, onShare, onBookmark }: PostCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);
  const [bookmarked, setBookmarked] = useState(false);
  const [shares, setShares] = useState(post.shares);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const imageUrls = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);

  const handleMoreOptions = () => {
    if (user?.id === post.authorId) {
      Alert.alert(
        'Post Options',
        '',
        [
          { text: 'Edit Post', onPress: () => router.push(`/post/edit/${post.id}`) },
          { text: 'Delete Post', style: 'destructive', onPress: () => handleDelete() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert(
        'Post Options',
        '',
        [
          { text: 'Report', onPress: () => Alert.alert('Reported', 'Thank you for reporting this post.') },
          { text: "Don't show me this post", onPress: () => Alert.alert('Hidden', 'We will show fewer posts like this.') },
          { text: 'Block Account', style: 'destructive', onPress: () => Alert.alert('Blocked', 'You will no longer see posts from this account.') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deletePost(post.id); if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); } catch {} } }
    ]);
  };

  useEffect(() => {
    setLiked(post.isLiked);
    setLikes(post.likes);
    setShares(post.shares);
  }, [post.id, post.isLiked, post.likes, post.shares]);

  async function handleLike() {
    const optimisticLiked = !liked;
    const optimisticLikes = liked ? likes - 1 : likes + 1;
    setLiked(optimisticLiked);
    setLikes(optimisticLikes);

    if (!onLike) return;

    try {
      const result = await onLike(post.id);
      if (result) {
        setLiked(result.isLiked);
        setLikes(result.likesCount);
      }
    } catch {
      setLiked(liked);
      setLikes(likes);
    }
  }

  async function handleShare() {
    setShares((prev) => prev + 1);
    if (!onShare) return;
    try {
      const result = await onShare(post.id);
      if (result) setShares(result.sharesCount);
    } catch {
      setShares(post.shares);
    }
  }

  async function handleBookmark() {
    const prev = bookmarked;
    setBookmarked(!bookmarked);
    try {
      const res = await togglePostBookmark(post.id);
      setBookmarked(res.bookmarked);
      onBookmark?.(post.id);
    } catch {
      setBookmarked(prev);
    }
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar uri={post.authorAvatar} name={post.authorName} size={42} />
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{post.authorName}</Text>
          <Text style={styles.time}>{new Date(post.createdAt).toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn} onPress={handleMoreOptions}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Images — single image or horizontal scroll for multiple */}
      {imageUrls.length === 1 && (
        <PostImage uri={imageUrls[0]} onPress={() => setZoomImage(imageUrls[0])} />
      )}
      {imageUrls.length > 1 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageCarousel}
        >
          {imageUrls.map((url, i) => (
            <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => setZoomImage(url)}>
              <Image
                source={{ uri: url }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {imageUrls.length > 1 && (
        <View style={styles.dotsRow}>
          {imageUrls.map((_, i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>
      )}

      {/* Zoom modal */}
      {zoomImage && (
        <ImageZoomModal
          visible={!!zoomImage}
          uri={zoomImage}
          onClose={() => setZoomImage(null)}
        />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.action} onPress={handleLike}>
            <Ionicons
              name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
              size={20}
              color={liked ? Colors.primary : Colors.text.secondary}
            />
            <Text style={[styles.actionText, liked && styles.actionTextActive]}>
              {formatCount(likes)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={() => router.push(`/post/${post.id}`)}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.text.secondary} />
            <Text style={styles.actionText}>{formatCount(post.comments)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={handleShare}>
            <Ionicons name="arrow-redo-outline" size={20} color={Colors.text.secondary} />
            <Text style={styles.actionText}>{formatCount(shares)}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleBookmark}>
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={bookmarked ? Colors.primary : Colors.text.secondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  headerInfo: { flex: 1, marginLeft: Spacing.sm },
  userName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  time: { fontSize: FontSize.xs, color: Colors.text.muted, marginTop: 2 },
  moreBtn: { padding: Spacing.xs },
  content: { fontSize: FontSize.base, color: Colors.text.primary, lineHeight: 22, marginBottom: Spacing.sm },
  postImage: { width: '100%', height: 250, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  imageCarousel: { marginBottom: Spacing.xs },
  carouselImage: {
    width: SCREEN_WIDTH - (Spacing.base * 4),
    height: 250,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 8, height: 8, borderRadius: 4,
  },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  leftActions: { flexDirection: 'row', gap: Spacing.base },
  action: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  actionText: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: FontWeight.medium },
  actionTextActive: { color: Colors.primary },
  // Zoom modal
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
});
