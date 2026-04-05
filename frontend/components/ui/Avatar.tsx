import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  showOnline?: boolean;
  style?: object;
}

export default function Avatar({ uri, name, size = 40, showOnline = false, style }: AvatarProps) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const radius = size / 2;

  return (
    <View style={[{ width: size, height: size }, style]}>
      {uri ? (
        <Image
          source={{ uri, cache: 'reload' }}
          style={{ width: size, height: size, borderRadius: radius }}
          key={uri}
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
