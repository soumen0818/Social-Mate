import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  showOnline?: boolean;
  style?: object;
}

/**
 * Extract the storage_path from a Supabase public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/posts_media/userid/avatar.jpg?t=123"
 *  → "userid/avatar.jpg"
 */
function extractStoragePath(url: string): string | null {
  // Strip query params first (cache-buster, etc.)
  const urlWithoutQuery = url.split('?')[0];
  const match = urlWithoutQuery.match(/posts_media\/(.+)$/);
  return match ? match[1] : null;
}

export default function Avatar({ uri, name, size = 40, showOnline = false, style }: AvatarProps) {
  const [displayUri, setDisplayUri] = useState<string | undefined>(uri);
  const [imgError, setImgError] = useState(false);
  const [triedSigned, setTriedSigned] = useState(false);

  // Reset everything whenever the URI prop changes (e.g. after a new photo is uploaded)
  useEffect(() => {
    setDisplayUri(uri);
    setImgError(false);
    setTriedSigned(false);
  }, [uri]);

  const handleImageError = async () => {
    // If we haven't tried a signed URL yet and the URI looks like a Supabase public URL
    if (!triedSigned && uri) {
      const storagePath = extractStoragePath(uri);
      if (storagePath) {
        setTriedSigned(true);
        try {
          const { data, error } = await supabase.storage
            .from('posts_media')
            .createSignedUrl(storagePath, 3600); // 1 hour expiry
          if (!error && data?.signedUrl) {
            setDisplayUri(data.signedUrl);
            setImgError(false); // reset error so image re-renders with signed URL
            return;
          }
        } catch {
          // signed URL also failed, fall through to initials
        }
      }
    }
    setImgError(true);
  };

  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const radius = size / 2;

  // Show image only if URI exists AND hasn't permanently errored out
  const showImage = !!displayUri && !imgError;

  return (
    <View style={[{ width: size, height: size }, style]}>
      {showImage ? (
        <Image
          source={{ uri: displayUri, cache: 'reload' }}
          style={{ width: size, height: size, borderRadius: radius }}
          onError={handleImageError}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: radius }]}>
          <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
        </View>
      )}
      {showOnline && (
        <View style={[styles.onlineDot, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, bottom: 0, right: 0 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.primary,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.background,
  },
});
