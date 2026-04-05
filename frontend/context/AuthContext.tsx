import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { API_BASE_URL } from '../lib/api';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const explicitOAuthRedirect = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL;

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  gender: string;
  website: string;
  followers: number;
  following: number;
  posts: number;
  photos: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  syncProfile: (supabaseUser: any, accessToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    // Check initial session & onboarding
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Silent auth check error:', error.message);
      }
      setSession(session);
      if (session) {
        syncProfile(session.user, session.access_token);
      }
      checkOnboarding();
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        syncProfile(session.user, session.access_token);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkOnboarding() {
    try {
      const onboarded = await AsyncStorage.getItem('sm_onboarded');
      if (onboarded === 'true') setIsOnboarded(true);
    } catch (e) {
      console.error('Failed to read onboarding state', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function syncProfile(supabaseUser: any, accessToken: string) {
    const fallbackUser: User = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.name || '',
      username: supabaseUser.email.split('@')[0],
      avatar: '',
      bio: '',
      gender: '',
      website: '',
      followers: 0,
      following: 0,
      posts: 0,
      photos: 0,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setUser(fallbackUser);
        return;
      }

      const profile = await response.json();
      setUser({
        id: profile.id || fallbackUser.id,
        email: profile.email || fallbackUser.email,
        name: profile.display_name || fallbackUser.name,
        username: profile.username || fallbackUser.username,
        avatar: profile.avatar_url || fallbackUser.avatar,
        bio: profile.bio || '',
        gender: profile.gender || '',
        website: profile.website || '',
        followers: profile.followers_count || 0,
        following: profile.following_count || 0,
        posts: profile.posts_count || 0,
        photos: profile.posts_count || 0,
      });
    } catch {
      setUser(fallbackUser);
    }
  }

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    // AuthListener will catch the state change and fire syncProfile
  }

  async function signUp(name: string, email: string, password: string) {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { name } // Captured cleanly in user_metadata for our SQL schema trigger!
      }
    });
    
    if (error) {
      setIsLoading(false);
      throw error;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function signInWithGoogle() {
    const isExpoGo = Constants.appOwnership === 'expo';
    const fallbackRedirect = Platform.OS === 'web'
      ? Linking.createURL('/auth/callback')
      : isExpoGo
        ? Linking.createURL('/auth/callback')
        : Linking.createURL('/auth/callback', { scheme: 'frontend' });

    const redirectTo = explicitOAuthRedirect || fallbackRedirect;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }

    if (!data?.url) {
      throw new Error('Could not initialize Google login.');
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== 'success' || !result.url) {
      throw new Error('Google sign-in was cancelled.');
    }

    const urlHash = result.url.includes('#') ? result.url.split('#')[1] : '';
    const hashParams = new URLSearchParams(urlHash);
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      throw new Error('Google login did not return session tokens.');
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      throw sessionError;
    }
  }

  async function completeOnboarding() {
    await AsyncStorage.setItem('sm_onboarded', 'true');
    setIsOnboarded(true);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isOnboarded, signIn, signUp, signInWithGoogle, signOut, completeOnboarding, syncProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
