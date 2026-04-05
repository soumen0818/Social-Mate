import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Avatar from '@/components/ui/Avatar';
import PostCard from '@/components/home/PostCard';
import { useAuth } from '@/context/AuthContext';
import { fetchPosts, togglePostLike } from '@/lib/socialApi';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/AppTheme';
import type { FeedPost } from '@/types/social';

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{typeof value === 'number' && value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'details'>('posts');
  const [myPosts, setMyPosts] = useState<FeedPost[]>([]);

  const loadMyPosts = useCallback(async () => {
    if (!user?.id) {
      setMyPosts([]);
      return;
    }

    try {
      const posts = await fetchPosts();
      setMyPosts(posts.filter((post) => post.authorId === user.id));
    } catch {
      setMyPosts([]);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMyPosts();
  }, [loadMyPosts]);

  async function handleLike(postId: string) {
    const result = await togglePostLike(postId);
    setMyPosts((prev) =>
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarBorder}>
            <Avatar uri={user?.avatar} name={user?.name} size={96} />
          </View>
        </View>

        {/* Name */}
        <View style={styles.nameSection}>
          <Text style={styles.name}>{user?.name ?? 'Social Mate User'}</Text>
        </View>

        {/* Edit Row */}
        <View style={styles.editRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <Text style={styles.editBtnText}>EDIT PROFILE</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="Post" value={user?.posts ?? 0} />
          <View style={styles.statDivider} />
          <StatBox label="Followers" value={user?.followers ?? 0} />
          <View style={styles.statDivider} />
          <StatBox label="Following" value={user?.following ?? 0} />
        </View>

        {/* Posts / Details tab */}
        <View style={styles.tabRow}>
          {(['posts', 'details'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabItem, activeTab === t && styles.tabItemActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'posts' ? (
          <View style={{ paddingTop: Spacing.sm }}>
            {myPosts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} />
            ))}
            {myPosts.length === 0 && (
              <View style={styles.emptyPosts}>
                <Text style={styles.emptyPostsText}>You have not posted anything yet.</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.detailsSection}>
            <DetailItem icon="person-outline" label="Full Name" value={user?.name ?? 'N/A'} />
            <DetailItem icon="male-female-outline" label="Gender" value={user?.gender || 'Not specified'} />
            <DetailItem icon="globe-outline" label="Website" value={user?.website || 'No website added'} />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
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
    ...Shadow.sm,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  settingsBtn: {
    padding: Spacing.xs,
  },
  avatarWrap: { alignItems: 'center', marginTop: Spacing.xl },
  avatarBorder: {
    width: 104, height: 104, borderRadius: 52,
    borderWidth: 3.5, borderColor: Colors.primary,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  nameSection: { alignItems: 'center', marginTop: Spacing.sm, paddingHorizontal: Spacing.base },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary },
  editRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.base, paddingHorizontal: Spacing.xxl,
  },
  editBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center',
  },
  editBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text.primary, letterSpacing: 1 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: Colors.background, marginTop: Spacing.lg,
    marginHorizontal: Spacing.base, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base, ...Shadow.sm,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.text.muted, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.background,
    marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  tabItem: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 2.5, borderBottomColor: Colors.text.primary },
  tabText: { fontSize: FontSize.base, color: Colors.text.muted, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.text.primary, fontWeight: FontWeight.bold },
  detailsSection: {
    backgroundColor: Colors.background, margin: Spacing.base,
    borderRadius: BorderRadius.lg, padding: Spacing.base, gap: Spacing.base, ...Shadow.sm,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  detailIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  detailLabel: { fontSize: FontSize.xs, color: Colors.text.muted },
  detailValue: { fontSize: FontSize.base, color: Colors.text.primary, fontWeight: FontWeight.medium },
  emptyPosts: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.lg, alignItems: 'center' },
  emptyPostsText: { color: Colors.text.secondary, fontSize: FontSize.base },
});
