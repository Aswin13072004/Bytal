import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, dbOperations } from '../utils/supabase';
import { User as UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await dbOperations.getUser(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          // No session present – force a clean logout state
          try { await supabase.auth.signOut(); } catch {}
          setUserProfile(null);
        }
      } catch (err) {
        // Ensure we never hang on loading if getSession fails (e.g., missing anon key / network)
        console.error('Failed to get initial session:', err);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event as any) === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          }
          setLoading(false);
          return;
        }
        if ((event as any) === 'TOKEN_REFRESH_FAILED' || event === 'SIGNED_OUT') {
          // Clear local session if refresh fails to avoid stuck loading
          try {
            await supabase.auth.signOut();
          } catch {}
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        // Default path
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // When returning to tab, ensure session is current to prevent 400 refresh loops
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            try { await supabase.auth.signOut(); } catch {}
            setUser(null);
            setUserProfile(null);
          }
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    // Ensure user profile exists, then update streak count on successful login
    if (data.user) {
      try {
        const existing = await dbOperations.getUser(data.user.id);
        if (!existing) {
          await dbOperations.createUserProfile({
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          });
        }
        await dbOperations.updateStreakCount(data.user.id);
      } catch (streakError) {
        console.error('Error updating streak count:', streakError);
        // Don't throw error here as the login was successful
      }
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    
    if (error) throw error;
    
    // Create user profile only if a session exists (no email confirmation flow)
    if (data.user && data.session) {
      try {
        await dbOperations.createUserProfile({
          id: data.user.id,
          email: data.user.email!,
          name: name,
        });
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
        // Don't throw error here as the user account was created successfully
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
