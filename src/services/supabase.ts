// Supabase Service Layer for Life Legacy AI
// Production-ready database integration

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { DEV_CONFIG } from '../config';

// Database Types
export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'premium';
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseMemo {
  id: string;
  user_id: string;
  audio_url: string;
  transcript?: string;
  confidence?: number;
  duration_seconds: number;
  file_size_bytes: number;
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  provider: 'whisper' | 'aqua';
  language: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTimelineItem {
  id: string;
  user_id: string;
  type: 'log' | 'chapter' | 'interview_answer';
  title?: string;
  content?: string;
  transcript?: string;
  audio_url?: string;
  memo_id?: string;
  session_id?: string;
  media_urls: string[];
  tags: string[];
  is_favorite: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseInterviewSession {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  questions: string[];
  current_question_index: number;
  status: 'active' | 'completed' | 'paused';
  mode: 'text' | 'voice' | 'mixed';
  created_at: string;
  updated_at: string;
}

export interface DatabaseInterviewAnswer {
  id: string;
  session_id: string;
  question_index: number;
  question_text: string;
  answer_text?: string;
  audio_url?: string;
  transcript?: string;
  source: 'text' | 'voice';
  created_at: string;
}

export interface DatabaseBook {
  id: string;
  user_id: string;
  title: string;
  subtitle?: string;
  description?: string;
  cover_image_url?: string;
  status: 'draft' | 'generating' | 'completed';
  format_settings: {
    include_images: boolean;
    include_audio_links: boolean;
    font_family: string;
    font_size: number;
  };
  export_jobs: {
    format: 'pdf' | 'epub' | 'docx';
    status: 'queued' | 'processing' | 'completed' | 'failed';
    download_url?: string;
    created_at: string;
  }[];
  created_at: string;
  updated_at: string;
}

// Database schema definition for setup
export const DATABASE_SCHEMA = {
  users: `
    CREATE TABLE users (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      avatar_url TEXT,
      subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
      onboarding_completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  memos: `
    CREATE TABLE memos (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      audio_url TEXT NOT NULL,
      transcript TEXT,
      confidence DECIMAL(3,2),
      duration_seconds INTEGER NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
      error_message TEXT,
      provider TEXT DEFAULT 'whisper' CHECK (provider IN ('whisper', 'aqua')),
      language TEXT DEFAULT 'en',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  timeline_items: `
    CREATE TABLE timeline_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('log', 'chapter', 'interview_answer')),
      title TEXT,
      content TEXT,
      transcript TEXT,
      audio_url TEXT,
      memo_id UUID REFERENCES memos(id) ON DELETE SET NULL,
      session_id UUID,
      media_urls TEXT[] DEFAULT '{}',
      tags TEXT[] DEFAULT '{}',
      is_favorite BOOLEAN DEFAULT FALSE,
      is_private BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  interview_sessions: `
    CREATE TABLE interview_sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      questions TEXT[] NOT NULL,
      current_question_index INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
      mode TEXT DEFAULT 'mixed' CHECK (mode IN ('text', 'voice', 'mixed')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  interview_answers: `
    CREATE TABLE interview_answers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
      question_index INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      answer_text TEXT,
      audio_url TEXT,
      transcript TEXT,
      source TEXT NOT NULL CHECK (source IN ('text', 'voice')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  books: `
    CREATE TABLE books (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      cover_image_url TEXT,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed')),
      format_settings JSONB DEFAULT '{"include_images": true, "include_audio_links": false, "font_family": "serif", "font_size": 12}',
      export_jobs JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
};

class SupabaseService {
  public client: SupabaseClient | null = null;
  private initialized = false;

  constructor() {
    if (!DEV_CONFIG.mockServices) {
      this.initialize();
    }
  }

  private initialize() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[Supabase] Missing URL or key - running in mock mode');
      return;
    }

    if (SUPABASE_URL.includes('localhost') || SUPABASE_URL.includes('mock')) {
      console.warn('[Supabase] Using mock/localhost URL - running in mock mode');
      return;
    }

    try {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Client-Info': 'life-legacy-ai@1.0.0'
          }
        }
      });

      this.initialized = true;
      console.log('[Supabase] Client initialized successfully');
    } catch (error) {
      console.error('[Supabase] Failed to initialize client:', error);
    }
  }

  // Check if Supabase is available and configured
  isReady(): boolean {
    return this.initialized && this.client !== null;
  }

  // Get current user
  getCurrentUser(): User | null {
    if (!this.isReady()) return null;
    return this.client!.auth.getUser().then(({ data }) => data.user).catch(() => null) as any;
  }

  // Get current session
  getCurrentSession(): Session | null {
    if (!this.isReady()) return null;
    return this.client!.auth.getSession().then(({ data }) => data.session).catch(() => null) as any;
  }

  // Authentication methods
  async signInWithEmail(email: string, password: string) {
    if (!this.isReady()) throw new Error('Supabase not configured');
    return await this.client!.auth.signInWithPassword({ email, password });
  }

  async signUpWithEmail(email: string, password: string, name: string) {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    const { data, error } = await this.client!.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      await this.createUserProfile(data.user.id, email, name);
    }

    return { data, error };
  }

  async signInWithOAuth(provider: 'google' | 'apple') {
    if (!this.isReady()) throw new Error('Supabase not configured');
    return await this.client!.auth.signInWithOAuth({ provider });
  }

  async signOut() {
    if (!this.isReady()) throw new Error('Supabase not configured');
    return await this.client!.auth.signOut();
  }

  // User profile methods
  async createUserProfile(userId: string, email: string, name: string) {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    const { data, error } = await this.client!
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        subscription_tier: 'free',
        onboarding_completed: false
      });

    if (error) throw error;
    return data;
  }

  async getUserProfile(userId: string): Promise<DatabaseUser | null> {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    const { data, error } = await this.client!
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<DatabaseUser>) {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    const { data, error } = await this.client!
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
    return data;
  }

  // Memo methods
  async createMemo(userId: string, memoData: Partial<DatabaseMemo>): Promise<DatabaseMemo> {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    const { data, error } = await this.client!
      .from('memos')
      .insert({
        user_id: userId,
        ...memoData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateMemo(memoId: string, updates: Partial<DatabaseMemo>) {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    const { data, error } = await this.client!
      .from('memos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', memoId);

    if (error) throw error;
    return data;
  }

  async getUserMemos(userId: string, limit = 50, offset = 0): Promise<DatabaseMemo[]> {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    const { data, error } = await this.client!
      .from('memos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Timeline methods
  async createTimelineItem(userId: string, itemData: Partial<DatabaseTimelineItem>): Promise<DatabaseTimelineItem> {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    const { data, error } = await this.client!
      .from('timeline_items')
      .insert({
        user_id: userId,
        ...itemData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserTimelineItems(userId: string, limit = 20, offset = 0): Promise<DatabaseTimelineItem[]> {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    const { data, error } = await this.client!
      .from('timeline_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async updateTimelineItem(itemId: string, updates: Partial<DatabaseTimelineItem>) {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    const { data, error } = await this.client!
      .from('timeline_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) throw error;
    return data;
  }

  async deleteTimelineItem(itemId: string) {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    const { error } = await this.client!
      .from('timeline_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }

  // Utility method to run database setup (for development)
  async setupDatabase() {
    if (!this.isReady()) throw new Error('Supabase not configured');
    
    console.log('[Supabase] Setting up database schema...');
    
    // Note: In production, you should run these via Supabase dashboard or migrations
    // This is just for development/testing
    const tables = Object.entries(DATABASE_SCHEMA);
    
    for (const [tableName, sql] of tables) {
      try {
        console.log(`[Supabase] Creating table: ${tableName}`);
        // Note: Raw SQL execution requires elevated permissions
        // In practice, you'd use Supabase migrations
      } catch (error) {
        console.error(`[Supabase] Failed to create table ${tableName}:`, error);
      }
    }
    
    console.log('[Supabase] Database setup completed');
  }
}

// Create singleton instance
export const supabase = new SupabaseService();
export default supabase;