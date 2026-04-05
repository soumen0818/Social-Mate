import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import {
  fetchDiscoverUsers,
  toggleFollow,
} from '@/lib/socialApi';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/AppTheme';
import type { FollowUser } from '@/types/social';

export default function SearchPeopleScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadPeople = useCallback(async (query: string = '') => {
    setLoading(true);
    try {
      const users = await fetchDiscoverUsers(query);
      setPeople(users);
    } catch {
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all users initially
  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadPeople(search);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, loadPeople]);

  async function handleToggleFollow(id: string) {
    // Optimistic update
    setPeople((prev) =>
      prev.map((person) =>
        person.id === id ? { ...person, isFollowing: !person.isFollowing } : person,
      ),
    );
    try {
      const result = await toggleFollow(id);
      setPeople((prev) =>
        prev.map((person) =>
          person.id === id ? { ...person, isFollowing: result.is_following } : person,
        ),
      );
    } catch {
      // Revert on error
      setPeople((prev) =>
        prev.map((person) =>
          person.id === id ? { ...person, isFollowing: !person.isFollowing } : person,
        ),
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discover People</Text>
        </View>
      </View>

      <FlatList
        data={people}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={Colors.text.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or username..."
              placeholderTextColor={Colors.text.muted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={Colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(`/user/${item.id}`)}
          >
            <Avatar uri={item.avatarUrl} name={item.displayName} size={50} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.displayName}</Text>
              <Text style={styles.username}>@{item.username}</Text>
              <Text style={styles.followersCount}>
                {(item.followersCount ?? 0).toLocaleString()} followers
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.followBtn, item.isFollowing && styles.followBtnActive]}
              onPress={() => handleToggleFollow(item.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.followBtnText, item.isFollowing && styles.followBtnTextActive]}>
                {item.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.text.muted} />
              <Text style={styles.emptyText}>
                {search ? `No users matching "${search}"` : 'No users found'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, height: 44, fontSize: FontSize.base, color: Colors.text.primary },
  list: { paddingHorizontal: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing.xxl, paddingTop: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  info: { flex: 1, marginLeft: Spacing.md },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.primary },
  username: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: 1 },
  followersCount: { fontSize: FontSize.xs, color: Colors.text.muted, marginTop: 2 },
  followBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 4,
    minWidth: 90,
    alignItems: 'center',
  },
  followBtnActive: { backgroundColor: '#F0F0F0' },
  followBtnText: { fontSize: 13, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  followBtnTextActive: { color: Colors.text.primary },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.base, color: Colors.text.muted, textAlign: 'center' },
});
