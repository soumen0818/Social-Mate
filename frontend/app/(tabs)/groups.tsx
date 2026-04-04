import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, TextInput, Modal, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/AppTheme';
import { fetchCommunities, fetchJoinedCommunities, createCommunity, toggleJoinCommunity } from '@/lib/socialApi';
import { Community } from '@/types/social';

export default function GroupsScreen() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'joined'>('discover');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = activeTab === 'joined' 
        ? await fetchJoinedCommunities()
        : await fetchCommunities();
      setCommunities(data);
    } catch (error) {
      console.error("Failed to load communities:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [activeTab, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleJoin = async (id: number, currentlyJoined: boolean) => {
    // Optimistic update
    setCommunities(prev => prev.map(c => {
      if (c.id === id) {
        return { 
          ...c, 
          is_joined: !currentlyJoined,
          members_count: currentlyJoined ? c.members_count - 1 : c.members_count + 1 
        };
      }
      return c;
    }));

    try {
      await toggleJoinCommunity(id);
      // Remove from 'joined' tab immediately if leaving
      if (activeTab === 'joined' && currentlyJoined) {
        setCommunities(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      // Revert on failure
      console.error(error);
      loadData();
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim().length) {
      Alert.alert("Error", "Group name is required.");
      return;
    }

    setCreating(true);
    try {
      const newGroup = await createCommunity({
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || undefined
      });
      
      setModalVisible(false);
      setNewGroupName('');
      setNewGroupDesc('');
      
      if (activeTab === 'joined' || activeTab === 'discover') {
        setCommunities(prev => [newGroup, ...prev]);
      }
      Alert.alert("Success", "Group created successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create group.");
    } finally {
      setCreating(false);
    }
  };

  const renderItem = ({ item }: { item: Community }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.groupName}>{item.name}</Text>
        {!!item.description && (
          <Text style={styles.groupDesc} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.memberRow}>
          <Ionicons name="people-outline" size={14} color={Colors.text.muted} />
          <Text style={styles.memberText}>{item.members_count} members</Text>
        </View>
        <TouchableOpacity
          style={[styles.joinBtn, item.is_joined && styles.joinBtnActive]}
          onPress={() => handleToggleJoin(item.id, !!item.is_joined)}
          activeOpacity={0.85}
        >
          <Text style={[styles.joinBtnText, item.is_joined && styles.joinBtnTextActive]}>
            {item.is_joined ? '✓ Joined' : 'Join Group'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="people-circle-outline" size={16} color={Colors.primary} />
        <Text style={styles.infoText}>
          Join communities to discover related posts!
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={communities}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-circle-outline" size={60} color={Colors.text.muted} />
              <Text style={styles.emptyText}>
                {activeTab === 'joined' ? "You haven't joined any groups yet." : "No groups discovered yet."}
              </Text>
            </View>
          }
        />
      )}

      {/* Create Group Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            
            <Text style={styles.modalLabel}>Group Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="E.g., Tech Enthusiasts"
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoCapitalize="words"
            />

            <Text style={styles.modalLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="What is this group about?"
              value={newGroupDesc}
              onChangeText={setNewGroupDesc}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]} 
                onPress={() => setModalVisible(false)}
                disabled={creating}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCreate]} 
                onPress={handleCreateGroup}
                disabled={creating}
              >
                {creating ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.modalCreateText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.lg,
    overflow: 'hidden', ...Shadow.sm, padding: Spacing.base,
  },
  cardContent: { },
  groupName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: 2 },
  groupDesc: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm, marginTop: 4 },
  memberText: { fontSize: FontSize.sm, color: Colors.text.muted },
  joinBtn: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm, alignItems: 'center', marginTop: Spacing.xs
  },
  joinBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  joinBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  joinBtnTextActive: { color: Colors.text.white },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.text.muted },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.lg, textAlign: 'center' },
  modalLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text.secondary, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#F5F7FA', borderRadius: BorderRadius.md, padding: Spacing.sm,
    fontSize: FontSize.base, marginBottom: Spacing.md, borderWidth: 1, borderColor: '#E5E7EB'
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  modalBtn: { flex: 1, paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.md, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#F3F4F6' },
  modalBtnCreate: { backgroundColor: Colors.primary },
  modalCancelText: { color: Colors.text.secondary, fontWeight: FontWeight.semibold },
  modalCreateText: { color: '#FFF', fontWeight: FontWeight.semibold },
});
