import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
        <Text style={styles.headerTitle}>Search People</Text>
      </View>

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

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar uri={item.avatarUrl} name={item.displayName} size={52} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.displayName}</Text>
              <Text style={styles.location}>
                <Ionicons name="at-outline" size={12} color={Colors.text.muted} />
                {'  '}@{item.username}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addBtn, item.isFollowing && styles.addBtnActive]}
              onPress={() => handleToggleFollow(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.isFollowing ? 'checkmark' : 'person-add-outline'}
                size={16}
                color={item.isFollowing ? Colors.text.white : Colors.primary}
              />
              <Text style={[styles.addBtnText, item.isFollowing && styles.addBtnTextActive]}>
                {item.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
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
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, height: 44, fontSize: FontSize.base, color: Colors.text.primary },
  list: { paddingHorizontal: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  info: { flex: 1, gap: 3, marginLeft: Spacing.md },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  location: { fontSize: FontSize.xs, color: Colors.text.muted },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  addBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  addBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  addBtnTextActive: { color: Colors.text.white },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.text.muted },
});
