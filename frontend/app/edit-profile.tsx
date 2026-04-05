import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/AppTheme';
import Avatar from '@/components/ui/Avatar';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/lib/api';
import { decode } from 'base64-arraybuffer';

function EditProfileScreen() {
  const router = useRouter();
  const { user, syncProfile } = useAuth() as any;

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
      setAvatarBase64(result.assets[0].base64 || null);
    }
  };

  const uploadAvatarToSupabase = async (uri: string, base64Str: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No session');

      const fileName = `avatar_${Date.now()}.jpg`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('posts_media')
        .upload(filePath, decode(base64Str), {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('posts_media').getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    } catch (e) {
      console.error('Upload Error:', e);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      // Upload new avatar if user picked one (avatarBase64 is only set when a new image is picked)
      let finalAvatarUrl: string | null = user.avatar || null;
      if (avatarBase64 && avatarUri && !avatarUri.startsWith('http')) {
        const newUrl = await uploadAvatarToSupabase(avatarUri, avatarBase64);
        if (newUrl) {
          finalAvatarUrl = newUrl;
        } else {
          // Upload failed — warn the user but still allow other fields to save
          Alert.alert('Photo Upload Failed', 'Could not upload your new photo. Other changes will still be saved.');
        }
      }

      // Sanitize website URL – prepend https:// if user typed a bare domain
      let sanitizedWebsite = website.trim();
      if (sanitizedWebsite && !sanitizedWebsite.startsWith('http://') && !sanitizedWebsite.startsWith('https://')) {
        sanitizedWebsite = 'https://' + sanitizedWebsite;
      }

      // Update via Django Backend
      const response = await fetch(`${API_BASE_URL}/api/users/me/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: name,
          bio,
          gender,
          // Send null (not empty string) so Django URLField doesn't reject it
          avatar_url: finalAvatarUrl || null,
          website: sanitizedWebsite || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update profile error:', errorText);
        throw new Error('Failed to update profile. Check your website URL and try again.');
      }

      // Re-sync profile from the backend so all screens pick up the new avatar/data
      await syncProfile(session.user, session.access_token);

      // Small delay to allow React context to propagate the new user state before navigating
      await new Promise(resolve => setTimeout(resolve, 150));

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarBorder}>
            <Avatar uri={avatarUri || undefined} name={name} size={100} />
            <TouchableOpacity style={styles.avatarEditBtn} onPress={handlePickImage} disabled={saving}>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Dave C. Brown"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio / Occupation</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Ui/UX Designer at Google..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other'].map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.genderChip, gender === g && styles.genderChipActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Website (Optional)</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://yourwebsite.com"
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIconBtn: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  saveBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  saveText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  body: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  avatarBorder: {
    padding: 4,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    position: 'relative',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 100,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  genderChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  genderText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
  genderTextActive: {
    color: Colors.primary,
  },
});

export default EditProfileScreen;
