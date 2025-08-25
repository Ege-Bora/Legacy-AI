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

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    console.log('[AuthContext] Setting up auth state listener');
    const unsubscribe = onAuthStateChange((session) => {
      console.log('[AuthContext] Auth state changed:', session ? 'authenticated' : 'not authenticated');
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

    return unsubscribe;
  }, []);

  // Register with email/password
  const register = async (email, password, name) => {
    try {
      setIsLoading(true);
      const session = await registerWithEmail(email, password, name);
      // State will be updated via onAuthStateChange
      return session.user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error(`Registration failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with email/password
  const loginEmail = async (email, password) => {
    try {
      setIsLoading(true);
      const session = await loginWithEmail(email, password);
      // State will be updated via onAuthStateChange
      return session.user;
    } catch (error) {
      console.error('Email login failed:', error);
      throw new Error(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google (legacy support)
  const login = async (provider) => {
    try {
      setIsLoading(true);
      let session;
      
      if (provider === 'google') {
        session = await signInWithGoogle();
      } else if (provider === 'apple') {
        session = await signInWithApple();
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
      
      // State will be updated via onAuthStateChange
      return session.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(`Login with ${provider} failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('[AuthContext] Starting logout...');
      await signOut();
      console.log('[AuthContext] SignOut completed');
      // State will be updated via onAuthStateChange
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error(`Logout failed: ${error.message}`);
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
