import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/AppTheme';

type Group = {
  id: string;
  name: string;
  members: number;
  isJoined: boolean;
  category: string;
};

function formatMembers(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toString();
}

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'joined'>('discover');

  const displayed = activeTab === 'joined'
    ? groups.filter(g => g.isJoined)
    : groups;

  function toggleJoin(id: string) {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, isJoined: !g.isJoined } : g));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity style={styles.createBtn}>
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="people-circle-outline" size={16} color={Colors.primary} />
        <Text style={styles.infoText}>
          Join communities and share posts with members. Group posts will also appear on your profile.
        </Text>
      </View>

      {/* Sub tabs */}
      <View style={styles.subTabs}>
        {(['discover', 'joined'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.subTab, activeTab === t && styles.subTabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.subTabText, activeTab === t && styles.subTabTextActive]}>
              {t === 'discover' ? 'Discover' : 'My Groups'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayed}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <Text style={styles.groupName}>{item.name}</Text>
              <View style={styles.memberRow}>
                <Ionicons name="people-outline" size={14} color={Colors.text.muted} />
                <Text style={styles.memberText}>{formatMembers(item.members)} members</Text>
              </View>
              <TouchableOpacity
                style={[styles.joinBtn, item.isJoined && styles.joinBtnActive]}
                onPress={() => toggleJoin(item.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.joinBtnText, item.isJoined && styles.joinBtnTextActive]}>
                  {item.isJoined ? '✓ Joined' : 'Join Group'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-circle-outline" size={60} color={Colors.text.muted} />
            <Text style={styles.emptyText}>No group data yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  createBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  subTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  subTab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  subTabActive: { borderBottomWidth: 2.5, borderBottomColor: Colors.primary },
  subTabText: { fontSize: FontSize.base, color: Colors.text.secondary, fontWeight: FontWeight.medium },
  subTabTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  list: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.lg,
    overflow: 'hidden', ...Shadow.sm,
  },
  cardContent: { padding: Spacing.base },
  categoryBadge: {
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  categoryText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  groupName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.xs },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  memberText: { fontSize: FontSize.sm, color: Colors.text.muted },
  joinBtn: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm, alignItems: 'center',
  },
  joinBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  joinBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  joinBtnTextActive: { color: Colors.text.white },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.text.muted },
});
