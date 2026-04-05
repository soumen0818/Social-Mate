import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Avatar from '@/components/ui/Avatar';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/AppTheme';
import type { User } from '@/context/AuthContext';

interface CreatePostBarProps {
  user: User | null;
}

export default function CreatePostBar({ user }: CreatePostBarProps) {
  const router = useRouter();
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Avatar uri={user?.avatar} name={user?.name} size={42} />
        <TouchableOpacity style={styles.input} onPress={() => router.push('/post/create')} activeOpacity={0.7}>
          <Text style={styles.placeholder}>What&apos;s on your head?</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={() => router.push('/post/create')}>
          <Ionicons name="image-outline" size={18} color={Colors.primary} />
          <Text style={styles.actionText}>Image</Text>
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
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    borderStyle: 'dashed',
    ...Shadow.sm,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
  },
  placeholder: { color: Colors.text.muted, fontSize: FontSize.base },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  action: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  actionText: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: FontWeight.medium },
  sep: { width: 1, height: 18, backgroundColor: Colors.border },
});
