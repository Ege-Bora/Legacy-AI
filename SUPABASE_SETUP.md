# 🗄️ Supabase Setup Guide for Life Legacy AI

This guide will help you set up Supabase as the production database for Life Legacy AI.

## 📋 **Prerequisites**

- Supabase account (free tier available)
- Access to Supabase dashboard
- Basic understanding of PostgreSQL

---

## 🚀 **Step 1: Create Supabase Project**

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in project details:
   - **Name**: `life-legacy-ai`
   - **Database Password**: Generate a secure password (save this!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"**
6. Wait for project initialization (~2 minutes)

---

## 🔑 **Step 2: Get API Keys**

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy these values:

```bash
# You'll need these for the next step:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **STOP HERE** - Tell the developer you need the API keys!

---

## 🗃️ **Step 3: Create Database Schema**

After providing the API keys, run this SQL in the Supabase SQL Editor:

### **Users Table**
```sql
-- Users table (extends auth.users)
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

-- Update trigger for users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **Memos Table**
```sql
-- Audio memos table
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

-- Update trigger for memos
CREATE TRIGGER update_memos_updated_at BEFORE UPDATE
    ON memos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for performance
CREATE INDEX idx_memos_user_id_created_at ON memos(user_id, created_at DESC);
CREATE INDEX idx_memos_status ON memos(status);
```

### **Timeline Items Table**
```sql
-- Timeline items table
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

-- Update trigger for timeline_items
CREATE TRIGGER update_timeline_items_updated_at BEFORE UPDATE
    ON timeline_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_timeline_items_user_id_created_at ON timeline_items(user_id, created_at DESC);
CREATE INDEX idx_timeline_items_type ON timeline_items(type);
CREATE INDEX idx_timeline_items_memo_id ON timeline_items(memo_id) WHERE memo_id IS NOT NULL;
```

### **Interview Tables**
```sql
-- Interview sessions table
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

-- Interview answers table
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

-- Update triggers
CREATE TRIGGER update_interview_sessions_updated_at BEFORE UPDATE
    ON interview_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_answers_session_id ON interview_answers(session_id);
```

### **Books Table**
```sql
-- Books table
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

-- Update trigger
CREATE TRIGGER update_books_updated_at BEFORE UPDATE
    ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index
CREATE INDEX idx_books_user_id ON books(user_id);
```

---

## 🔐 **Step 4: Configure Row Level Security (RLS)**

Enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT
    USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE
    USING (auth.uid() = id);

-- Memos policies
CREATE POLICY "Users can view own memos" ON memos FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memos" ON memos FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memos" ON memos FOR UPDATE
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memos" ON memos FOR DELETE
    USING (auth.uid() = user_id);

-- Timeline items policies
CREATE POLICY "Users can view own timeline items" ON timeline_items FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own timeline items" ON timeline_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own timeline items" ON timeline_items FOR UPDATE
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own timeline items" ON timeline_items FOR DELETE
    USING (auth.uid() = user_id);

-- Interview sessions policies
CREATE POLICY "Users can manage own interview sessions" ON interview_sessions FOR ALL
    USING (auth.uid() = user_id);

-- Interview answers policies
CREATE POLICY "Users can manage own interview answers" ON interview_answers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM interview_sessions 
        WHERE interview_sessions.id = interview_answers.session_id 
        AND interview_sessions.user_id = auth.uid()
    ));

-- Books policies
CREATE POLICY "Users can manage own books" ON books FOR ALL
    USING (auth.uid() = user_id);
```

---

## ⚙️ **Step 5: Configure Storage (Optional)**

If you want to store audio files in Supabase Storage:

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `audio-files`
3. Set bucket to **Public** if you want direct access to audio files
4. Add storage policies:

```sql
-- Audio files storage policies
CREATE POLICY "Users can upload own audio files" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own audio files" ON storage.objects FOR SELECT
    USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🧪 **Step 6: Test Connection**

After providing the API keys, test the connection:

1. Open the app
2. Go to **Settings** → **Developer Options**
3. Toggle **"Supabase Integration"** to **ON**
4. Restart the app
5. Try signing up with a new email
6. Check Supabase dashboard to see if user was created

---

## 🚨 **Security Considerations**

### **Environment Variables**
Never commit API keys to git:
```bash
# Add to .env file:
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### **API Key Types**
- **anon/public key**: Safe to use in client apps
- **service_role key**: Never use in client apps! (Server-only)

### **RLS Policies**
- All policies ensure users can only access their own data
- Review policies regularly for security

---

## 🔄 **Step 7: Migration Strategy**

To migrate existing mock data to Supabase:

1. Enable Supabase mode in developer settings
2. Export existing data using "Export Debug Logs"
3. Create a migration script to import data
4. Test thoroughly before switching production users

---

## 📊 **Monitoring**

Monitor your Supabase project:

1. **Database Usage**: Check storage and bandwidth limits
2. **API Requests**: Monitor request volume
3. **Performance**: Watch query performance in dashboard
4. **Errors**: Set up log drains for error monitoring

---

## 🆘 **Troubleshooting**

### **Common Issues**

1. **Connection Failed**: Check URL and API key
2. **Permission Denied**: Review RLS policies
3. **Schema Errors**: Ensure all migrations ran successfully
4. **Auth Issues**: Check OAuth provider settings

### **Debug Mode**

Enable debug logging:
1. Go to Developer Settings
2. Enable "Debug Mode"
3. Check console logs for detailed error messages

---

## 🎯 **Next Steps**

After Supabase is working:

1. **Set up backups**: Configure automated backups
2. **Add monitoring**: Set up alerts for errors/performance
3. **Optimize queries**: Add indexes for slow queries
4. **Scale planning**: Monitor usage for upgrade planning

---

## 📚 **Resources**

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)

---

**Need help?** Check the Supabase community or documentation for additional support.