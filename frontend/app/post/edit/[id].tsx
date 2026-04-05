import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchPostDetails, updatePost } from '@/lib/socialApi';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/AppTheme';

export default function EditPostScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const d = await fetchPostDetails(id as string);
        setContent(d.content);
      } catch (e) {
        Alert.alert('Error', 'Failed to load post');
        if (router.canGoBack()) router.back();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    if (!content.trim()) {
      Alert.alert('Error', 'Caption cannot be empty');
      return;
    }
    setSubmitting(true);
    try {
      await updatePost(id as string, content);
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', 'Failed to update post');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Post</Text>
        <TouchableOpacity style={[styles.saveBtn, (!content.trim() || submitting) && styles.saveBtnDisabled]} onPress={handleSave} disabled={!content.trim() || submitting}>
          <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            multiline
            placeholder="Edit your caption..."
            placeholderTextColor={Colors.text.muted}
            autoFocus
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { padding: Spacing.xs },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFF', fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
  content: { flex: 1, padding: Spacing.base },
  input: { flex: 1, fontSize: FontSize.base, color: Colors.text.primary, lineHeight: 24, textAlignVertical: 'top' }
});
