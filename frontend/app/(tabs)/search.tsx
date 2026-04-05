import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import {
  buildPeopleSuggestionsFromFollows,
  fetchFollowers,
  fetchFollowing,
  toggleFollow,
} from '@/lib/socialApi';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/AppTheme';
import type { FollowUser } from '@/types/social';

export default function SearchPeopleScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState<FollowUser[]>([]);

  const loadPeople = useCallback(async () => {
    if (!user?.id) {
      setPeople([]);
      return;
    }

    try {
      const [followers, following] = await Promise.all([
        fetchFollowers(user.id),
        fetchFollowing(user.id),
      ]);
      setPeople(buildPeopleSuggestionsFromFollows(followers, following, user.id));
    } catch {
      setPeople([]);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const filtered = useMemo(
    () =>
      people.filter((person) =>
        `${person.displayName} ${person.username}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [people, search],
  );

  async function handleToggleFollow(id: string) {
    const result = await toggleFollow(id);
    setPeople((prev) => prev.map((person) => (person.id === id ? { ...person, isFollowing: result.is_following } : person)));
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
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={Colors.text.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search people..."
              placeholderTextColor={Colors.text.muted}
              value={search}
              onChangeText={setSearch}
            />
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
              <Text style={styles.followersCount}>
                {item.followersCount !== undefined ? item.followersCount.toLocaleString() : '1,256'} followers
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addBtn, item.isFollowing && styles.addBtnActive]}
              onPress={() => handleToggleFollow(item.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.addBtnText, item.isFollowing && styles.addBtnTextActive]}>
                {item.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyText}>No people found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F8FF' }, // Light blue tint
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text.primary },
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
  list: { paddingHorizontal: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing.xxl, paddingTop: Spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  info: { flex: 1, gap: 2, marginLeft: Spacing.md },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.primary },
  followersCount: { fontSize: FontSize.sm, color: Colors.text.muted },
  addBtn: {
    backgroundColor: '#007BFF', // Bright blue
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 4,
  },
  addBtnActive: { backgroundColor: '#EFEFEF' },
  addBtnText: { fontSize: 13, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  addBtnTextActive: { color: Colors.text.primary },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.text.muted },
});
