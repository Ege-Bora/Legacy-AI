import * as SecureStore from 'expo-secure-store';
import { User, Session, ApiError } from '../types';
import { DEV_CONFIG } from '../config';

const SESSION_KEY = 'user_session';
const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_KEY = 'access_token';

// Backend API URL - using localhost:8080 for real backend
const BACKEND_URL = 'http://localhost:8080';

// Mock user data for development
const MOCK_USER: User = {
  id: 'mock-user-123',
  email: 'user@example.com',
  name: 'John Doe',
  avatarUrl: 'https://via.placeholder.com/150',
  createdAt: new Date().toISOString(),
  subscription: {
    status: 'premium',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

// Types for backend API
interface BackendUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: string;
  provider_id: string | null;
  subscription_status: string;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface BackendSession {
  user: BackendUser;
  tokens: BackendAuthTokens;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

class AuthService {
  private session: Session | null = null;
  private listeners: Array<(session: Session | null) => void> = [];

  constructor() {
    this.initializeSession();
  }

  private async initializeSession() {
    try {
      if (DEV_CONFIG.mockServices) {
        console.log('[AUTH] Initializing in mock mode - starting logged out');
        // In mock mode, always start logged out to test flows
        this.session = null;
        this.notifyListeners();
        return;
      }

      const sessionData = await SecureStore.getItemAsync(SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData) as Session;
        
        // Check if session is expired
        if (new Date(session.expiresAt) > new Date()) {
          this.session = session;
          this.notifyListeners();
        } else {
          // Session expired, clear it
          await this.clearSession();
        }
      } else {
        // No session found, ensure we're logged out
        this.session = null;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      await this.clearSession();
    }
  }

  private async saveSession(session: Session) {
    try {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
      if (session.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken);
      }
      this.session = session;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('Failed to save session');
    }
  }

  private async clearSession() {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      this.session = null;
      this.notifyListeners();
      console.log('[AUTH] Session cleared successfully');
    } catch (error) {
      console.error('Failed to clear session:', error);
      // Even if SecureStore fails, clear the session
      this.session = null;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.session));
  }

  private createMockSession(): Session {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    return {
      user: MOCK_USER,
      accessToken: `mock-token-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
      expiresAt,
    };
  }

  // Convert backend user to frontend user format
  private mapBackendUser(backendUser: BackendUser): User {
    return {
      id: backendUser.id,
      email: backendUser.email,
      name: backendUser.name,
      avatarUrl: backendUser.avatar_url || undefined,
      createdAt: backendUser.created_at,
      subscription: {
        status: backendUser.subscription_status as 'free' | 'premium' | 'lifetime',
        expiresAt: backendUser.subscription_expires_at,
      },
    };
  }

  // Create session from backend response
  private createSessionFromBackend(backendSession: BackendSession): Session {
    const expiresAt = new Date(Date.now() + backendSession.tokens.expiresIn * 1000).toISOString();
    
    return {
      user: this.mapBackendUser(backendSession.user),
      accessToken: backendSession.tokens.accessToken,
      refreshToken: backendSession.tokens.refreshToken,
      expiresAt,
    };
  }

  // Make API request to backend
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BACKEND_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Register with email/password
  async registerWithEmail(email: string, password: string, name: string): Promise<Session> {
    if (DEV_CONFIG.mockServices) {
      console.log('[AUTH] Register with email (mocked)', { email, name });
      const session = this.createMockSession();
      await this.saveSession(session);
      return session;
    }

    try {
      const registerData: RegisterRequest = { email, password, name };
      const backendSession = await this.apiRequest<BackendSession>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      });

      const session = this.createSessionFromBackend(backendSession);
      await this.saveSession(session);
      return session;
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Login with email/password
  async loginWithEmail(email: string, password: string): Promise<Session> {
    if (DEV_CONFIG.mockServices) {
      console.log('[AUTH] Login with email (mocked)', { email });
      const session = this.createMockSession();
      await this.saveSession(session);
      return session;
    }

    try {
      const loginData: LoginRequest = { email, password };
      const backendSession = await this.apiRequest<BackendSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });

      const session = this.createSessionFromBackend(backendSession);
      await this.saveSession(session);
      return session;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSession(): Promise<Session | null> {
    if (DEV_CONFIG.mockServices) {
      console.log('[AUTH] Getting session (mocked)');
    }
    return this.session;
  }

  async signInWithGoogle(): Promise<Session> {
    if (DEV_CONFIG.mockServices) {
      console.log('[AUTH] Sign in with Google (mocked)');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const session = this.createMockSession();
      await this.saveSession(session);
      return session;
    }

    // TODO: Implement real Google Sign-In
    throw new Error('Google Sign-In not implemented yet');
  }

  async signInWithApple(): Promise<Session> {
    if (DEV_CONFIG.mockServices) {
      console.log('[AUTH] Sign in with Apple (mocked)');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const session = this.createMockSession();
      await this.saveSession(session);
      return session;
    }

    // TODO: Implement real Apple Sign-In
    throw new Error('Apple Sign-In not implemented yet');
  }

  async signOut(): Promise<void> {
    if (DEV_CONFIG.mockServices) {
      console.log('[AUTH] Sign out (mocked)');
      // Force clear the session completely in mock mode
      this.session = null;
      await this.clearSession();
      this.notifyListeners();
      return;
    }

    try {
      // Call backend to logout and invalidate refresh token
      if (this.session?.refreshToken) {
        await this.apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.session.refreshToken }),
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    }

    await this.clearSession();
  }

  async refreshSession(): Promise<Session> {
    if (!this.session?.refreshToken) {
      throw new Error('No refresh token available');
    }

    if (DEV_CONFIG.mockServices) {
      console.log('[AUTH] Refresh session (mocked)');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const session = this.createMockSession();
      await this.saveSession(session);
      return session;
    }

    try {
      const refreshToken = this.session.refreshToken;
      const backendTokens = await this.apiRequest<BackendAuthTokens>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      // Keep existing user data, update tokens
      const expiresAt = new Date(Date.now() + backendTokens.expiresIn * 1000).toISOString();
      const session: Session = {
        user: this.session.user,
        accessToken: backendTokens.accessToken,
        refreshToken: backendTokens.refreshToken,
        expiresAt,
      };

      await this.saveSession(session);
      return session;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, clear session
      await this.clearSession();
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteAccount(): Promise<void> {
    if (DEV_CONFIG.mockServices) {
      console.log('[AUTH] Delete account (mocked)');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.clearSession();
      return;
    }

    // TODO: Implement real account deletion
    throw new Error('Account deletion not implemented yet');
  }

  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    this.listeners.push(callback);
    
    console.log('[AUTH] New listener added. Current session:', this.session ? 'authenticated' : 'null');
    
    // Call immediately with current state
    setTimeout(() => {
      callback(this.session);
    }, 0);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Utility method for development
  async createMockSessionForDev(): Promise<Session> {
    const session = this.createMockSession();
    await this.saveSession(session);
    return session;
  }
}

export const authService = new AuthService();

// Convenience exports
export const getSession = () => authService.getSession();
export const signInWithGoogle = () => authService.signInWithGoogle();
export const signInWithApple = () => authService.signInWithApple();
export const signOut = () => authService.signOut();
export const deleteAccount = () => authService.deleteAccount();
export const registerWithEmail = (email: string, password: string, name: string) => 
  authService.registerWithEmail(email, password, name);
export const loginWithEmail = (email: string, password: string) => 
  authService.loginWithEmail(email, password);
export const refreshSession = () => authService.refreshSession();
export const onAuthStateChange = (callback: (session: Session | null) => void) => 
  authService.onAuthStateChange(callback);
