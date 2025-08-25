import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { memoryDb } from '../database/memory';
import { 
  User, 
  CreateUserData, 
  LoginCredentials, 
  RegisterData, 
  AuthTokens, 
  JWTPayload,
  Session
} from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

class AuthService {
  // Generate JWT tokens
  private generateTokens(user: User): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '1h'
    });

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1 hour in seconds
    };
  }

  // Verify JWT token
  verifyAccessToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Hash password
  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, 12);
  }

  // Verify password
  private verifyPassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }

  // Create new user
  createUser(userData: CreateUserData): User {
    const userId = uuidv4();
    const now = new Date().toISOString();

    let passwordHash = null;
    if (userData.password) {
      passwordHash = this.hashPassword(userData.password);
    }

    const newUser = {
      id: userId,
      email: userData.email.toLowerCase(),
      password_hash: passwordHash,
      name: userData.name,
      provider: userData.provider || 'email',
      provider_id: userData.provider_id,
      avatar_url: userData.avatar_url,
      subscription_status: 'free',
      subscription_expires_at: null,
      created_at: now,
      updated_at: now
    };

    memoryDb.createUser(newUser);

    const user = this.getUserById(userId);
    if (!user) {
      throw new Error('Failed to create user');
    }

    return user;
  }

  // Get user by ID
  getUserById(userId: string): User | null {
    const row = memoryDb.getUserById(userId);
    
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatar_url: row.avatar_url,
      provider: row.provider,
      provider_id: row.provider_id,
      subscription_status: row.subscription_status,
      subscription_expires_at: row.subscription_expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  // Get user by email
  getUserByEmail(email: string): User | null {
    const row = memoryDb.getUserByEmail(email);
    
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatar_url: row.avatar_url,
      provider: row.provider,
      provider_id: row.provider_id,
      subscription_status: row.subscription_status,
      subscription_expires_at: row.subscription_expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  // Register new user with email/password
  register(data: RegisterData): Session {
    // Check if user already exists
    const existingUser = this.getUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const user = this.createUser({
      email: data.email,
      password: data.password,
      name: data.name,
      provider: 'email'
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  // Login with email/password
  login(credentials: LoginCredentials): Session {
    const user = this.getUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Get password hash from memory database
    const userData = memoryDb.getUserByEmail(credentials.email);
    
    if (!userData?.password_hash) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = this.verifyPassword(credentials.password, userData.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  // Store refresh token in memory database
  private storeRefreshToken(userId: string, token: string): void {
    const tokenId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    
    const tokenData = {
      id: tokenId,
      user_id: userId,
      token: token,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    };

    memoryDb.storeRefreshToken(tokenData);
  }

  // Refresh access token
  refreshToken(refreshToken: string): AuthTokens {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists in database
      const tokenWithUser = memoryDb.getRefreshTokenWithUser(refreshToken);
      if (!tokenWithUser) {
        throw new Error('Invalid or expired refresh token');
      }

      const user: User = {
        id: tokenWithUser.id,
        email: tokenWithUser.email,
        name: tokenWithUser.name,
        avatar_url: tokenWithUser.avatar_url,
        provider: tokenWithUser.provider,
        provider_id: tokenWithUser.provider_id,
        subscription_status: tokenWithUser.subscription_status,
        subscription_expires_at: tokenWithUser.subscription_expires_at,
        created_at: tokenWithUser.created_at,
        updated_at: tokenWithUser.updated_at
      };

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Store new refresh token and remove old one
      this.replaceRefreshToken(refreshToken, tokens.refreshToken, user.id);

      return tokens;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Replace refresh token
  private replaceRefreshToken(oldToken: string, newToken: string, userId: string): void {
    // Delete old token
    memoryDb.deleteRefreshToken(oldToken);
    
    // Store new token
    this.storeRefreshToken(userId, newToken);
  }

  // Logout (remove refresh token)
  logout(refreshToken: string): void {
    memoryDb.deleteRefreshToken(refreshToken);
  }

  // Get user profile with token
  getProfile(token: string): User {
    const payload = this.verifyAccessToken(token);
    const user = this.getUserById(payload.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Clean expired refresh tokens (maintenance)
  cleanExpiredTokens(): void {
    memoryDb.cleanExpiredTokens();
  }

  // Debug method
  getDebugInfo(): any {
    return memoryDb.getStats();
  }
}

export const authService = new AuthService();