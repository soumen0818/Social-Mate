import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadStory } from '@/lib/socialApi';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight, Spacing } from '@/constants/AppTheme';
import type { StoryItem } from '@/types/social';

interface StoryBarProps {
  stories: StoryItem[];
  onStoryUploaded?: () => void;
}

export default function StoryBar({ stories, onStoryUploaded }: StoryBarProps) {
  const [uploading, setUploading] = useState(false);

  const handleAddStory = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow media library permission to add stories.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Error', 'Could not read image data.');
        return;
      }

      setUploading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('Not logged in');

        // Step 1: Upload the image to Supabase Storage
        const ext = (asset.fileName || 'story.jpg').split('.').pop()?.toLowerCase() || 'jpg';
        const contentType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;
        const storagePath = `${session.user.id}/stories/story_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('posts_media')
          .upload(storagePath, decode(asset.base64), {
            contentType,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Step 2: Create the story in backend with the storage_path
        await uploadStory({
          storage_path: storagePath,
          text: '',
        });

        Alert.alert('Success', 'Story uploaded successfully!');
        onStoryUploaded?.();
      } catch (e: any) {
        console.error('Story upload error:', e);
        Alert.alert('Error', e.message || 'Failed to upload story');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {stories.map((story) => (
        <TouchableOpacity
          key={story.id}
          style={styles.storyItem}
          activeOpacity={0.8}
          onPress={story.isOwn ? handleAddStory : undefined}
          disabled={uploading && story.isOwn}
        >
          {story.isOwn ? (
            <View style={styles.addStoryCircle}>
              {uploading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="add" size={28} color={Colors.primary} />
              )}
            </View>
          ) : (
            <LinearGradient
              colors={story.hasStory ? [Colors.primary, '#7B2FFF'] : [Colors.border, Colors.border]}
              style={styles.storyRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.storyImageWrapper}>
                <Image source={{ uri: story.avatar }} style={styles.storyImage} />
              </View>
            </LinearGradient>
          )}
          <Text style={styles.storyName} numberOfLines={1}>{story.isOwn ? 'Your Story' : story.user}</Text>  
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.base,
  },
  storyItem: { alignItems: 'center', width: 62 },
  addStoryCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  storyRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyImageWrapper: {
    width: 61,
    height: 61,
    borderRadius: 30.5,
    borderWidth: 2,
    borderColor: Colors.background,
    overflow: 'hidden',
  },
  storyImage: { width: '100%', height: '100%' },
  storyName: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
    maxWidth: 62,
  },
});
