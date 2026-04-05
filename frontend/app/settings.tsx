import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight, Spacing } from '@/constants/AppTheme';
import Avatar from '@/components/ui/Avatar';

type MenuItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  route?: string;
  action?: () => void;
};

function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleNavigation = (route?: string, action?: () => void) => {
    if (action) {
      action();
    } else if (route) {
      // @ts-ignore - expo router catching dynamically added routes
      router.push(route);
    } else {
      Alert.alert('Coming Soon', 'This feature is under development.');
    }
  };

  const MENU_ITEMS: MenuItem[] = [
    { icon: 'pencil-outline', label: 'Edit Profile', route: '/edit-profile' },
    { icon: 'people-outline', label: 'Network' },
    { icon: 'images-outline', label: 'Photos' },
    { icon: 'bookmark-outline', label: 'Bookmarks', route: '/bookmarks' },
    { icon: 'people-circle-outline', label: 'Group', route: '/(tabs)/groups' },
    { icon: 'lock-closed-outline', label: 'Your Privacy' },
    { icon: 'search-outline', label: 'Search Profile', route: '/(tabs)/search' },
    { icon: 'settings-outline', label: 'Settings' },
    { icon: 'information-circle-outline', label: 'About Us' },
    { icon: 'language-outline', label: 'Language' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Background Gradient/Image mock (soft fade) */}
      <View style={styles.bgMock} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarBorder}>
            <Avatar uri={user?.avatar} name={user?.name} size={96} />
          </View>
          <Text style={styles.name}>{user?.name ?? 'Social Mate User'}</Text>
          <Text style={styles.username}>@{user?.username ?? 'username'}</Text>
        </View>

        <View style={styles.divider} />

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.route, item.action)}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          ))}
          
          {/* Logout separately placed closer to the bottom layout styling */}
          <TouchableOpacity style={[styles.menuItem, { marginTop: Spacing.xl }]} onPress={handleLogout}>
            <View style={styles.menuIconWrap}>
              <Ionicons name="log-out-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgMock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: '#F3F8FC', // Mocking a subtle background at the top reflecting the screenshot
    opacity: 0.6,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  avatarBorder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#4BA1FD', // A bright blue distinct border as seen on screenshot
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: '#000000',
    marginBottom: 4,
  },
  username: {
    fontSize: FontSize.md,
    color: '#555555',
  },
  divider: {
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  menuContainer: {
    paddingHorizontal: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  menuIconWrap: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.base,
    color: '#333333',
    fontWeight: FontWeight.medium,
  },
});

export default SettingsScreen;
