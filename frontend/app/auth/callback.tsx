import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Wait until AuthContext finishes checking the Supabase session
    if (!isLoading) {
      if (user) {
        // Success: Go to Home
        router.replace('/(tabs)');
      } else {
        // Failed / Cancelled: Go back to Sign In
        router.replace('/(auth)');
      }
    }
  }, [user, isLoading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
