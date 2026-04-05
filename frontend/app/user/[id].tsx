import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '@/components/ui/Avatar';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/AppTheme';
import { fetchUserProfile, fetchUserPosts, toggleFollow } from '@/lib/socialApi';
import PostCard from '@/components/home/PostCard';
import type { FeedPost } from '@/types/social';

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Post' | 'Details'>('Details');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      try {
        setLoading(true);
        const [prof, userPosts] = await Promise.all([
          fetchUserProfile(id),
          fetchUserPosts(id)
        ]);
        setProfile(prof);
        setIsFollowing(!!prof.is_following);
        
        // Map backend posts to frontend
        const mappedPosts = userPosts.map((p: any) => ({
          id: p.id,
          authorId: p.author_id,
          authorName: p.author_display_name || p.author_username,
          authorAvatar: p.author_avatar_url || '',
          content: p.caption,
          likes: p.likes_count,
          comments: p.comments_count,
          shares: p.shares_count,
          createdAt: p.created_at,
          imageUrl: p.images?.[0]?.image_url,
          isLiked: false, 
        }));
        setPosts(mappedPosts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleToggleFollow = async () => {
    if (!profile) return;
    // Optimistic toggle
    setIsFollowing(!isFollowing);
    try {
      const res = await toggleFollow(id);
      setIsFollowing(res.is_following);
      setProfile((prev: any) => ({
        ...prev,
        followers_count: res.is_following ? prev.followers_count + 1 : Math.max(0, prev.followers_count - 1)
      }));
    } catch (e) {
      setIsFollowing(!isFollowing); // revert
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.errorText}>User not found</Text>
      </SafeAreaView>
    );
  }

  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.0', '')}k`;
    return num.toString();
  };

  const renderDetails = () => (
    <View style={styles.detailsContent}>
      {/* About Me Card */}
      <View style={styles.boxCard}>
        <View style={styles.boxCardHeader}>
          <Ionicons name="person-outline" size={18} color={Colors.text.secondary} />
          <Text style={styles.boxCardTitle}>About me</Text>
        </View>
        <Text style={styles.boxCardText}>
          {profile.bio || "No bio provided."}
        </Text>
      </View>

      {/* Work Experience Card */}
      <View style={styles.boxCard}>
        <View style={styles.boxCardHeader}>
          <Ionicons name="briefcase-outline" size={18} color={Colors.text.secondary} />
          <Text style={styles.boxCardTitle}>Work Experience</Text>
        </View>
        <View style={styles.bulletItem}>
          <View style={styles.bullet} />
          <Text style={styles.boxCardText}>Ux/Ui Designer At Google</Text>
        </View>
        <View style={styles.bulletItem}>
          <View style={styles.bullet} />
          <Text style={styles.boxCardText}>Graphic Designer At Apple</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.safe}>
      {/* Top Header overlay */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => { if(router.canGoBack()) router.back(); else router.replace('/(tabs)/search');}}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={{flex:1}}/>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]} // Sticky tabs!
      >
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarBorder}>
            <Avatar uri={profile.avatar_url} name={profile.display_name} size={110} />
          </View>
          
          <Text style={styles.name}>{profile.display_name || profile.username}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          <Text style={styles.role}>{profile.bio ? profile.bio.split('\n')[0] : 'Member'}</Text>
          
          <TouchableOpacity 
            style={[styles.followBtn, isFollowing && styles.followBtnActive]} 
            onPress={handleToggleFollow}
            activeOpacity={0.8}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(profile.posts_count)}</Text>
            <Text style={styles.statLabel}>Post</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(profile.photos_count || 0)}</Text> 
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(profile.followers_count)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(profile.following_count)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Sticky Tabs */}
        <View style={styles.tabContainerWrapper}>
          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'Post' && styles.tabActive]} 
              onPress={() => setActiveTab('Post')}
            >
              <Text style={[styles.tabLabel, activeTab === 'Post' && styles.tabLabelActive]}>Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'Details' && styles.tabActive]} 
              onPress={() => setActiveTab('Details')}
            >
              <Text style={[styles.tabLabel, activeTab === 'Details' && styles.tabLabelActive]}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'Details' ? renderDetails() : (
            <View style={styles.postsContent}>
              {posts.length === 0 ? (
                <View style={styles.emptyPosts}>
                  <Ionicons name="images-outline" size={40} color={Colors.text.muted} />
                  <Text style={styles.errorText}>No posts yet.</Text>
                </View>
              ) : (
                posts.map(post => (
                   <PostCard key={post.id} post={post} />
                ))
              )}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F8FF' }, // Light blue tint to match mock
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: FontSize.md, color: Colors.text.muted, marginTop: Spacing.sm },
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: 50, // Avoid using safeAreaView everywhere to let the background scroll smoothly
    paddingBottom: Spacing.sm,
    backgroundColor: 'transparent',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10,
  },
  iconBtn: { padding: 4 },
  
  profileSection: {
    alignItems: 'center',
    marginTop: 80, 
    paddingHorizontal: Spacing.xl,
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 60,
    backgroundColor: '#FFF',
    ...Shadow.sm,
    borderWidth: 2,
    borderColor: '#007BFF', // Blue border
    marginBottom: Spacing.md,
  },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: 2 },
  username: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: 4 },
  role: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.md },
  
  followBtn: {
    backgroundColor: '#007BFF', // Base solid blue
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: BorderRadius.sm,
    ...Shadow.sm,
  },
  followBtnActive: { backgroundColor: '#EFEFEF' },
  followBtnText: { color: '#FFF', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  followBtnTextActive: { color: Colors.text.primary },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  statItem: { alignItems: 'center', paddingHorizontal: Spacing.sm },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: 2 },
  statLabel: { fontSize: FontSize.xs, color: Colors.text.muted },
  statDivider: {
    height: 30,
    width: 1,
    backgroundColor: '#EFEFEF',
  },

  tabContainerWrapper: {
    backgroundColor: '#F0F8FF', 
    paddingTop: Spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    marginHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#007BFF' },
  tabLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text.muted },
  tabLabelActive: { color: '#007BFF' },

  tabContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  
  postsContent: { gap: Spacing.base, paddingBottom: Spacing.xl },
  emptyPosts: { alignItems: 'center', marginTop: 40 },

  detailsContent: { gap: Spacing.md },
  boxCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  boxCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  boxCardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.secondary },
  boxCardText: { fontSize: FontSize.sm, color: Colors.text.secondary, lineHeight: 20 },
  bulletItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.text.muted },
});