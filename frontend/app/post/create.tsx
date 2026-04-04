import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { createPost } from '@/lib/socialApi';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/AppTheme';

const MAX_IMAGES = 2;
const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;

type PickedImage = {
  uri: string;
  fileName?: string | null;
  fileSize?: number;
};

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<PickedImage[]>([]);
  const audience = 'Public';
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePickImages() {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', 'You can add up to 2 images only.');
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
      quality: 0.9,
      selectionLimit: MAX_IMAGES - images.length,
    });

    if (result.canceled) {
      return;
    }

    const newImages = result.assets.map((asset) => ({
      uri: asset.uri,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
    }));

    const tooLarge = newImages.find((image) => (image.fileSize ?? 0) > MAX_IMAGE_SIZE_BYTES);
    if (tooLarge) {
      Alert.alert('File too large', 'Each image must be 1MB or less.');
      return;
    }

    if (newImages.some((image) => image.fileSize == null)) {
      Alert.alert('File size unavailable', 'Please pick a different image under 1MB.');
      return;
    }

    setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
  }

  function handleRemoveImage(uri: string) {
    setImages((prev) => prev.filter((image) => image.uri !== uri));
  }

  function handleClose() {
    router.replace('/(tabs)/index');
  }

  async function handlePost() {
    if (!content.trim() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await createPost(content.trim());
      router.replace('/(tabs)/index');
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
            style={[styles.postBtn, (!content || isSubmitting) && styles.postBtnDisabled]}
            disabled={!content || isSubmitting}
          >
            <Text style={[styles.postBtnText, (!content || isSubmitting) && styles.postBtnTextDisabled]}>
              {isSubmitting ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* User info */}
          <View style={styles.userRow}>
            <Avatar uri={user?.avatar} name={user?.name} size={44} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
              <TouchableOpacity style={styles.audienceBtn}>
                <Ionicons name="earth-outline" size={12} color={Colors.primary} />
                <Text style={styles.audienceText}>{audience}</Text>
                <Ionicons name="chevron-down" size={12} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Text input */}
          <TextInput
            style={styles.input}
            placeholder="What's on your head?"
            placeholderTextColor={Colors.text.muted}
            multiline
            value={content}
            onChangeText={setContent}
            autoFocus
            textAlignVertical="top"
          />

          {/* Drag handle */}
          <View style={styles.handle} />

          <View style={styles.options}>
            <TouchableOpacity style={styles.option} activeOpacity={0.8} onPress={handlePickImages}>
              <View style={[styles.optionIcon, { backgroundColor: '#1D7FE818' }]}>
                <Ionicons name="image-outline" size={20} color="#1D7FE8" />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionLabel}>Add Photos</Text>
                <Text style={styles.optionHint}>Only images. Max 2 files, 1MB each.</Text>
              </View>
            </TouchableOpacity>

            {images.length > 0 && (
              <View style={styles.previewGrid}>
                {images.map((image) => (
                  <View key={image.uri} style={styles.previewItem}>
                    <Image source={{ uri: image.uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(image.uri)}
                      style={styles.removePreviewBtn}
                    >
                      <Ionicons name="close" size={14} color={Colors.text.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
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
  postBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  postBtnDisabled: {},
  postBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  postBtnTextDisabled: { color: Colors.text.muted },
  body: { flex: 1 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.base,
  },
  userInfo: { gap: Spacing.xs },
  userName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  audienceBtn: {
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
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginVertical: Spacing.base,
  },
  options: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxl },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  optionTextWrap: { flex: 1 },
  optionIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLabel: { fontSize: FontSize.md, color: Colors.text.primary, fontWeight: FontWeight.medium },
  optionHint: {
    marginTop: 2,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  previewGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  previewItem: {
    width: 92,
    height: 92,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removePreviewBtn: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
