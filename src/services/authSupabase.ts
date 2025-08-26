// Supabase Authentication Service
// Production authentication using Supabase Auth

import { supabase } from './supabase';
import { DEV_CONFIG } from '../config';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'premium';
  onboarding_completed: boolean;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

export interface SignInResponse {
  success: boolean;
  user?: AuthUser;
  session?: AuthSession;
  error?: string;
}

export interface SignUpResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
  needsEmailVerification?: boolean;
}

class SupabaseAuthService {
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    if (DEV_CONFIG.useSupabase && supabase.isReady()) {
      this.setupAuthListener();
    }
  }

  private setupAuthListener() {
    if (!supabase.client) return;

    supabase.client.auth.onAuthStateChange(async (event, session) => {
      console.log('[SupabaseAuth] Auth state changed:', event, session?.user?.id);
      
      let user: AuthUser | null = null;
      
      if (session?.user) {
        // Get user profile from our users table
        try {
          const profile = await supabase.getUserProfile(session.user.id);
          if (profile) {
            user = {
              id: profile.id,
              email: profile.email,
              name: profile.name || 'User',
              avatar_url: profile.avatar_url,
              subscription_tier: profile.subscription_tier,
              onboarding_completed: profile.onboarding_completed
            };
          }
        } catch (error) {
          console.error('[SupabaseAuth] Failed to fetch user profile:', error);
          
          // Fallback to auth user data
          user = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 'User',
            avatar_url: session.user.user_metadata?.avatar_url,
            subscription_tier: 'free',
            onboarding_completed: false
          };
        }
      }

      this.notifyListeners(user);
    });
  }

  private notifyListeners(user: AuthUser | null) {
    this.listeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('[SupabaseAuth] Listener error:', error);
      }
    });
  }

  // Subscribe to auth state changes
  addListener(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!DEV_CONFIG.useSupabase || !supabase.isReady()) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.client!.auth.getUser();
      
      if (!user) return null;

      const profile = await supabase.getUserProfile(user.id);
      
      return {
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.user_metadata?.name || 'User',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
        subscription_tier: profile?.subscription_tier || 'free',
        onboarding_completed: profile?.onboarding_completed || false
      };
    } catch (error) {
      console.error('[SupabaseAuth] Failed to get current user:', error);
      return null;
    }
  }

  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<SignInResponse> {
    if (!DEV_CONFIG.useSupabase || !supabase.isReady()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.signInWithEmail(email, password);
      
      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user || !data.session) {
        return { success: false, error: 'Invalid response from server' };
      }

      // Get user profile
      const profile = await supabase.getUserProfile(data.user.id);
      
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: profile?.name || data.user.user_metadata?.name || 'User',
        avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url,
        subscription_tier: profile?.subscription_tier || 'free',
        onboarding_completed: profile?.onboarding_completed || false
      };

      const session: AuthSession = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0,
        user
      };

      return { success: true, user, session };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  // Sign up with email and password
  async signUpWithEmail(email: string, password: string, name: string): Promise<SignUpResponse> {
    if (!DEV_CONFIG.useSupabase || !supabase.isReady()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.signUpWithEmail(email, password, name);
      
      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Failed to create user' };
      }

      // Check if email confirmation is needed
      const needsEmailVerification = !data.session;

      let user: AuthUser | undefined;
      
      if (data.session) {
        // User is immediately signed in
        const profile = await supabase.getUserProfile(data.user.id);
        
        user = {
          id: data.user.id,
          email: data.user.email || '',
          name: profile?.name || name,
          avatar_url: profile?.avatar_url,
          subscription_tier: profile?.subscription_tier || 'free',
          onboarding_completed: profile?.onboarding_completed || false
        };
      }

      return { 
        success: true, 
        user,
        needsEmailVerification 
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      };
    }
  }

  // Sign in with OAuth (Google/Apple)
  async signInWithOAuth(provider: 'google' | 'apple'): Promise<SignInResponse> {
    if (!DEV_CONFIG.useSupabase || !supabase.isReady()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.signInWithOAuth(provider);
      
      if (error) {
        return { success: false, error: error.message };
      }

      // OAuth flows typically redirect, so we can't return user data immediately
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth sign in failed'
      };
    }
  }

  // Sign out
  async signOut(): Promise<{ success: boolean; error?: string }> {
    if (!DEV_CONFIG.useSupabase || !supabase.isReady()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<Pick<AuthUser, 'name' | 'avatar_url' | 'onboarding_completed'>>): Promise<{ success: boolean; error?: string }> {
    if (!DEV_CONFIG.useSupabase || !supabase.isReady()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'No authenticated user' };
      }

      await supabase.updateUserProfile(user.id, updates);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed'
      };
    }
  }
}

// Create singleton instance
export const supabaseAuth = new SupabaseAuthService();
export default supabaseAuth;