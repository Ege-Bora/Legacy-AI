import Database from 'better-sqlite3';
import path from 'path';

class DatabaseManager {
  private db: Database.Database;
  
  constructor() {
    // Store database in backend/data directory
    const dbPath = path.join(__dirname, '../../data/life-legacy.db');
    console.log('Database path:', dbPath);
    
    this.db = new Database(dbPath);
    console.log('Connected to SQLite database');
    this.init();
  }

  private init() {
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT NOT NULL,
        avatar_url TEXT,
        provider TEXT DEFAULT 'email',
        provider_id TEXT,
        subscription_status TEXT DEFAULT 'free',
        subscription_expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create refresh_tokens table
    const createRefreshTokensTable = `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    // Create sessions table for tracking active sessions
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_info TEXT,
        last_active TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;

    try {
      this.db.exec(createUsersTable);
      this.db.exec(createRefreshTokensTable);
      this.db.exec(createSessionsTable);
      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing database tables:', error);
    }
  }

  // Database methods with better-sqlite3
  run(sql: string, params: any[] = []): void {
    const stmt = this.db.prepare(sql);
    stmt.run(...params);
  }

  get(sql: string, params: any[] = []): any {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params);
  }

  all(sql: string, params: any[] = []): any[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  close(): void {
    this.db.close();
  }

  getDatabase() {
    return this.db;
  }
}

// Export singleton instance
export const database = new DatabaseManager();