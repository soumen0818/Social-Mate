import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadStory } from '@/lib/socialApi';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight, Spacing } from '@/constants/AppTheme';
import type { StoryItem } from '@/types/social';

interface StoryBarProps {
  stories: StoryItem[];
}

export default function StoryBar({ stories }: StoryBarProps) {
  const handleAddStory = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow media library permission to add stories.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        await uploadStory({
          image_url: result.assets[0].uri, // Simulate upload mapping in backend via presigned or simply storing uri for demo
          text: 'New Story',
        });
        Alert.alert('Success', 'Story uploaded successfully!');
      } catch (e) {
        Alert.alert('Error', 'Failed to upload story');
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
        >
          {story.isOwn ? (
            <View style={styles.addStoryCircle}>
              <Ionicons name="add" size={28} color={Colors.primary} />
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
