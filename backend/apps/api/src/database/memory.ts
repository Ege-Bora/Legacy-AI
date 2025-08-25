import { User, RefreshToken } from '../types/auth';

// Simple in-memory database for development
class MemoryDatabase {
  private users: Map<string, any> = new Map();
  private usersByEmail: Map<string, string> = new Map(); // email -> userId mapping
  private refreshTokens: Map<string, any> = new Map();

  // Initialize with empty state
  constructor() {
    console.log('Using in-memory database for development');
  }

  // User operations
  createUser(userData: any): void {
    this.users.set(userData.id, userData);
    this.usersByEmail.set(userData.email.toLowerCase(), userData.id);
  }

  getUserById(id: string): any | null {
    return this.users.get(id) || null;
  }

  getUserByEmail(email: string): any | null {
    const userId = this.usersByEmail.get(email.toLowerCase());
    return userId ? this.users.get(userId) || null : null;
  }

  // Refresh token operations
  storeRefreshToken(tokenData: any): void {
    this.refreshTokens.set(tokenData.token, tokenData);
  }

  getRefreshToken(token: string): any | null {
    return this.refreshTokens.get(token) || null;
  }

  deleteRefreshToken(token: string): void {
    this.refreshTokens.delete(token);
  }

  // Query with JOIN (simplified)
  getRefreshTokenWithUser(token: string): any | null {
    const tokenData = this.getRefreshToken(token);
    if (!tokenData) return null;

    const user = this.getUserById(tokenData.user_id);
    if (!user) return null;

    // Check if not expired
    if (new Date(tokenData.expires_at) <= new Date()) {
      this.deleteRefreshToken(token);
      return null;
    }

    return {
      ...tokenData,
      ...user
    };
  }

  // Cleanup expired tokens
  cleanExpiredTokens(): void {
    const now = new Date();
    for (const [token, tokenData] of this.refreshTokens.entries()) {
      if (new Date(tokenData.expires_at) <= now) {
        this.refreshTokens.delete(token);
      }
    }
  }

  // Debug info
  getStats(): any {
    return {
      users: this.users.size,
      refreshTokens: this.refreshTokens.size,
      userEmails: Array.from(this.usersByEmail.keys())
    };
  }
}

// Export singleton instance
export const memoryDb = new MemoryDatabase();