import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  authService, 
  registerWithEmail, 
  loginWithEmail, 
  signInWithGoogle, 
  signInWithApple, 
  signOut,
  onAuthStateChange 
} from '../services/auth';
import { supabaseAuth } from '../services/authSupabase';
import { DEV_CONFIG } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    console.log('[AuthContext] Setting up auth state listener');
    
    let unsubscribe;
    
    if (DEV_CONFIG.useSupabase) {
      // Use Supabase auth
      console.log('[AuthContext] Using Supabase authentication');
      unsubscribe = supabaseAuth.addListener((user) => {
        console.log('[AuthContext] Supabase auth state changed:', user ? 'authenticated' : 'not authenticated');
        setIsLoading(false);
        if (user) {
          setUser(user);
          setIsAuthenticated(true);
          console.log('[AuthContext] User set:', user.name || user.email);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          console.log('[AuthContext] User cleared - should show onboarding');
        }
      });
    } else {
      // Use mock auth
      console.log('[AuthContext] Using mock authentication');
      unsubscribe = onAuthStateChange((session) => {
        console.log('[AuthContext] Mock auth state changed:', session ? 'authenticated' : 'not authenticated');
        setIsLoading(false);
        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
          console.log('[AuthContext] User set:', session.user.name || session.user.email);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          console.log('[AuthContext] User cleared - should show onboarding');
        }
      });
    }

    return unsubscribe;
  }, []);

  // Register with email/password
  const register = async (email, password, name) => {
    try {
      setIsLoading(true);
      if (DEV_CONFIG.useSupabase) {
        const result = await supabaseAuth.signUpWithEmail(email, password, name);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.user;
      } else {
        const session = await registerWithEmail(email, password, name);
        return session.user;
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error(`Registration failed: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with email/password
  const loginEmail = async (email, password) => {
    try {
      setIsLoading(true);
      if (DEV_CONFIG.useSupabase) {
        const result = await supabaseAuth.signInWithEmail(email, password);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.user;
      } else {
        const session = await loginWithEmail(email, password);
        return session.user;
      }
    } catch (error) {
      console.error('Email login failed:', error);
      throw new Error(`Login failed: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google (legacy support)
  const login = async (provider) => {
    try {
      setIsLoading(true);
      
      if (DEV_CONFIG.useSupabase) {
        const result = await supabaseAuth.signInWithOAuth(provider);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.user; // May be undefined for OAuth redirects
      } else {
        let session;
        
        if (provider === 'google') {
          session = await signInWithGoogle();
        } else if (provider === 'apple') {
          session = await signInWithApple();
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }
        
        return session.user;
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(`Login with ${provider} failed: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('[AuthContext] Starting logout...');
      
      if (DEV_CONFIG.useSupabase) {
        const result = await supabaseAuth.signOut();
        if (!result.success) {
          throw new Error(result.error);
        }
        console.log('[AuthContext] Supabase signOut completed');
      } else {
        await signOut();
        console.log('[AuthContext] Mock signOut completed');
      }
      
      // State will be updated via onAuthStateChange
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error(`Logout failed: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    register,
    login,
    loginEmail,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
