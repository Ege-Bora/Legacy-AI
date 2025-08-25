export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: 'email' | 'google' | 'apple';
  provider_id?: string;
  subscription_status: 'free' | 'premium' | 'canceled';
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password?: string;
  name: string;
  provider?: 'email' | 'google' | 'apple';
  provider_id?: string;
  avatar_url?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface Session {
  user: User;
  tokens: AuthTokens;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AppleUserInfo {
  sub: string;
  email: string;
  name?: string;
}