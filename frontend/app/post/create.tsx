import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/AppTheme';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/lib/api';
import { decode } from 'base64-arraybuffer';

const MAX_IMAGES = 3;

type PickedImage = {
  uri: string;
  fileName?: string | null;
  fileSize?: number;
  base64?: string | null;
};

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<PickedImage[]>([]);
  const audience = 'Public';
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePickImages() {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', 'You can add up to 3 images only.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow media library permission to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      base64: true,
      selectionLimit: MAX_IMAGES - images.length,
    });

    if (result.canceled) return;

    const newImages: PickedImage[] = result.assets.map((asset) => ({
      uri: asset.uri,
      fileName: asset.fileName || `image_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
      base64: asset.base64,
    }));

    setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
  }

  function handleRemoveImage(uri: string) {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  }

  function handleClose() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  /** Upload images to Supabase Storage via the backend intent flow, returns storage paths */
  async function uploadImagesToSupabase(accessToken: string): Promise<string[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No session');

    const uploadedPaths: string[] = [];

    for (const img of images) {
      if (!img.base64) continue;

      const ext = (img.fileName || 'photo.jpg').split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;

      // Step 1: Register upload intent with backend to get a valid storage_path
      const intentRes = await fetch(`${API_BASE_URL}/api/posts/upload-urls/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: [{
            file_name: img.fileName || `photo.${ext}`,
            content_type: contentType,
            size_bytes: img.fileSize || Math.ceil(img.base64.length * 0.75),
          }],
        }),
      });

      if (!intentRes.ok) {
        const err = await intentRes.text();
        console.warn('Intent registration failed:', err);
        continue;
      }

      const intentData = await intentRes.json();
      const upload = intentData.uploads?.[0];
      if (!upload?.storage_path) continue;

      // Step 2: Upload binary directly to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('posts_media')
        .upload(upload.storage_path, decode(img.base64), {
          contentType,
          upsert: false,
        });

      if (storageError) {
        console.warn('Storage upload failed:', storageError.message);
        continue;
      }

      uploadedPaths.push(upload.storage_path);
    }

    return uploadedPaths;
  }

  async function handlePost() {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const accessToken = session.access_token;

      // Upload images first if any were selected
      let uploadedPaths: string[] = [];
      if (images.length > 0) {
        uploadedPaths = await uploadImagesToSupabase(accessToken);
        if (uploadedPaths.length === 0) {
          Alert.alert('Photo Upload Failed', 'Could not upload images. The post will be created with text only.');
        }
      }

      // Create the post with caption + image storage paths
      const res = await fetch(`${API_BASE_URL}/api/posts/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption: content.trim(),
          uploaded_paths: uploadedPaths,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Failed to create post');
      }

      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not create post');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create a Post</Text>
          <TouchableOpacity
            onPress={handlePost}
            style={[styles.postBtn, (!content.trim() || isSubmitting) && styles.postBtnDisabled]}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.postBtnText, !content.trim() && styles.postBtnTextDisabled]}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* User info row */}
          <View style={styles.userRow}>
            <Avatar uri={user?.avatar} name={user?.name} size={44} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
              <View style={styles.audienceChip}>
                <Ionicons name="earth-outline" size={12} color={Colors.primary} />
                <Text style={styles.audienceText}>{audience}</Text>
              </View>
            </View>
          </View>

          {/* Text input */}
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.text.muted}
            multiline
            value={content}
            onChangeText={setContent}
            autoFocus
            textAlignVertical="top"
          />

          {/* Image previews */}
          {images.length > 0 && (
            <View style={styles.previewGrid}>
              {images.map((image) => (
                <View key={image.uri} style={styles.previewItem}>
                  <Image source={{ uri: image.uri }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(image.uri)}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Bottom toolbar */}
        <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
          <TouchableOpacity
            style={[styles.toolbarBtn, images.length >= MAX_IMAGES && styles.toolbarBtnDisabled]}
            onPress={handlePickImages}
            disabled={images.length >= MAX_IMAGES}
          >
            <Ionicons
              name="image-outline"
              size={22}
              color={images.length >= MAX_IMAGES ? Colors.text.muted : Colors.primary}
            />
            <Text style={[styles.toolbarBtnText, images.length >= MAX_IMAGES && { color: Colors.text.muted }]}>
              {images.length > 0 ? `Photos (${images.length}/${MAX_IMAGES})` : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  postBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  postBtnDisabled: { backgroundColor: Colors.border },
  postBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  postBtnTextDisabled: { color: Colors.text.muted },
  body: { flex: 1 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.base,
  },
  userInfo: { gap: Spacing.xs },
  userName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  audienceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  audienceText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.medium },
  input: {
    minHeight: 120, paddingHorizontal: Spacing.base,
    fontSize: FontSize.md, color: Colors.text.primary, lineHeight: 24,
  },
  previewGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing.sm, paddingHorizontal: Spacing.base,
    marginTop: Spacing.sm,
  },
  previewItem: {
    width: 120, height: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute', right: 6, top: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  toolbarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  toolbarBtnDisabled: { opacity: 0.5 },
  toolbarBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
});
