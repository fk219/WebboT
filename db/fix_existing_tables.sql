-- =====================================================
-- FIX EXISTING TABLES - Run this if tables already exist
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Step 1: Create missing tables
-- =====================================================

-- Organizations table (if doesn't exist)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (if doesn't exist)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    phone_number VARCHAR(50),
    avatar_url TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Step 2: Check if bots table exists, if so rename to agents
-- =====================================================

DO $$ 
BEGIN
    -- If bots table exists and agents doesn't, rename it
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bots') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agents') THEN
        ALTER TABLE bots RENAME TO agents;
    END IF;
END $$;

-- =====================================================
-- Step 3: Create agents table if it doesn't exist
-- =====================================================

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Step 4: Add organization_id to agents if missing
-- =====================================================

DO $$ 
BEGIN
    -- Add organization_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agents' 
        AND column_name = 'organization_id'
    ) THEN
        -- Add the column without foreign key first
        ALTER TABLE agents ADD COLUMN organization_id UUID;
        
        -- Set a default organization for existing agents
        -- This will use the first organization or create one if none exists
        UPDATE agents SET organization_id = (
            SELECT id FROM organizations LIMIT 1
        ) WHERE organization_id IS NULL;
        
        -- If no organizations exist, create a default one
        INSERT INTO organizations (name, owner_id)
        SELECT 'Default Organization', id FROM auth.users LIMIT 1
        ON CONFLICT DO NOTHING;
        
        -- Update agents again with the new organization
        UPDATE agents SET organization_id = (
            SELECT id FROM organizations LIMIT 1
        ) WHERE organization_id IS NULL;
        
        -- Now make it NOT NULL and add foreign key
        ALTER TABLE agents ALTER COLUMN organization_id SET NOT NULL;
        ALTER TABLE agents ADD CONSTRAINT agents_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- Step 5: Add all LangGraph fields to agents table
-- =====================================================

-- LLM Configuration
ALTER TABLE agents ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(50) DEFAULT 'openai';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS llm_model VARCHAR(100) DEFAULT 'gpt-4o-mini';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 1000;

-- Voice Configuration
ALTER TABLE agents ADD COLUMN IF NOT EXISTS voice_provider VARCHAR(50);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS voice_id VARCHAR(255);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS voice_model VARCHAR(100);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS voice_speed DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS voice_temperature DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS voice_volume DECIMAL(3,2) DEFAULT 1.0;

-- Speech Processing
ALTER TABLE agents ADD COLUMN IF NOT EXISTS responsiveness DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS interruption_sensitivity DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS enable_backchannel BOOLEAN DEFAULT true;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS backchannel_words JSONB DEFAULT '["mm-hmm", "yeah", "uh-huh"]'::jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS normalize_speech BOOLEAN DEFAULT true;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS boosted_keywords JSONB DEFAULT '[]'::jsonb;

-- Environment
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ambient_sound VARCHAR(50) DEFAULT 'none';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ambient_volume DECIMAL(3,2) DEFAULT 0.5;

-- Call Settings
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_duration_seconds INTEGER DEFAULT 1800;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS end_after_silence_seconds INTEGER DEFAULT 600;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS voicemail_detection BOOLEAN DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS voicemail_action VARCHAR(20) DEFAULT 'hangup';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS voicemail_message TEXT;

-- Transcription
ALTER TABLE agents ADD COLUMN IF NOT EXISTS stt_provider VARCHAR(50) DEFAULT 'whisper';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS stt_mode VARCHAR(20) DEFAULT 'fast';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS denoising_mode VARCHAR(50) DEFAULT 'noise-cancellation';

-- Security & Privacy
ALTER TABLE agents ADD COLUMN IF NOT EXISTS pii_redaction_enabled BOOLEAN DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS pii_redaction_list JSONB DEFAULT '[]'::jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS data_storage_policy VARCHAR(50) DEFAULT 'everything';

-- Integration
ALTER TABLE agents ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS webhook_timeout_ms INTEGER DEFAULT 5000;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS custom_headers JSONB DEFAULT '{}'::jsonb;

-- MCP Tools
ALTER TABLE agents ADD COLUMN IF NOT EXISTS enabled_mcp_servers JSONB DEFAULT '[]'::jsonb;

-- Knowledge Base
ALTER TABLE agents ADD COLUMN IF NOT EXISTS knowledge_base_ids JSONB DEFAULT '[]'::jsonb;

-- Status
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- =====================================================
-- Step 6: Handle chat_sessions -> agent_sessions
-- =====================================================

DO $$ 
BEGIN
    -- If chat_sessions exists and agent_sessions doesn't, rename it
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_sessions') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_sessions') THEN
        ALTER TABLE chat_sessions RENAME TO agent_sessions;
    END IF;
END $$;

-- Create agent_sessions if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add agent_id column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_sessions' 
        AND column_name = 'agent_id'
    ) THEN
        ALTER TABLE agent_sessions ADD COLUMN agent_id UUID;
        
        -- Set a default agent for existing sessions
        UPDATE agent_sessions SET agent_id = (
            SELECT id FROM agents LIMIT 1
        ) WHERE agent_id IS NULL;
        
        -- Make it NOT NULL and add foreign key
        ALTER TABLE agent_sessions ALTER COLUMN agent_id SET NOT NULL;
        ALTER TABLE agent_sessions ADD CONSTRAINT agent_sessions_agent_id_fkey 
            FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add session management fields
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS website_domain VARCHAR(255);
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'text';
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS conversation_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- Step 7: Handle chat_messages -> agent_messages
-- =====================================================

DO $$ 
BEGIN
    -- If chat_messages exists and agent_messages doesn't, rename it
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_messages') THEN
        ALTER TABLE chat_messages RENAME TO agent_messages;
    END IF;
END $$;

-- Create agent_messages if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add voice & metadata fields
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS audio_duration_ms INTEGER;
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS tokens_used INTEGER;
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS latency_ms INTEGER;
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS model_used VARCHAR(100);

-- =====================================================
-- Step 8: Create or update usage_logs table
-- =====================================================

CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES agent_sessions(id) ON DELETE SET NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,4) DEFAULT 0,
    model_used VARCHAR(100),
    channel VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add agent_id and organization_id to usage_logs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usage_logs' 
        AND column_name = 'agent_id'
    ) THEN
        ALTER TABLE usage_logs ADD COLUMN agent_id UUID;
        
        -- Set default agent for existing logs
        UPDATE usage_logs SET agent_id = (
            SELECT id FROM agents LIMIT 1
        ) WHERE agent_id IS NULL;
        
        ALTER TABLE usage_logs ALTER COLUMN agent_id SET NOT NULL;
        ALTER TABLE usage_logs ADD CONSTRAINT usage_logs_agent_id_fkey 
            FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usage_logs' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE usage_logs ADD COLUMN organization_id UUID;
        
        -- Set default organization for existing logs
        UPDATE usage_logs SET organization_id = (
            SELECT id FROM organizations LIMIT 1
        ) WHERE organization_id IS NULL;
        
        ALTER TABLE usage_logs ALTER COLUMN organization_id SET NOT NULL;
        ALTER TABLE usage_logs ADD CONSTRAINT usage_logs_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- Step 9: Create indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_agents_organization ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent ON agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_session_id ON agent_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_session ON agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_agent ON usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_organization ON usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);

-- =====================================================
-- Step 10: Enable RLS and create policies
-- =====================================================

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view agents in their organizations" ON agents;
DROP POLICY IF EXISTS "Users can create agents in their organizations" ON agents;
DROP POLICY IF EXISTS "Users can update agents in their organizations" ON agents;
DROP POLICY IF EXISTS "Users can delete agents in their organizations" ON agents;
DROP POLICY IF EXISTS "Anyone can view agent sessions" ON agent_sessions;
DROP POLICY IF EXISTS "Anyone can create agent sessions" ON agent_sessions;
DROP POLICY IF EXISTS "Anyone can update agent sessions" ON agent_sessions;
DROP POLICY IF EXISTS "Anyone can view agent messages" ON agent_messages;
DROP POLICY IF EXISTS "Anyone can create agent messages" ON agent_messages;
DROP POLICY IF EXISTS "Users can view usage logs for their organizations" ON usage_logs;

-- Organizations policies
CREATE POLICY "Users can view their own organizations" ON organizations
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own organizations" ON organizations
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own organizations" ON organizations
    FOR DELETE USING (auth.uid() = owner_id);

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Agents policies
CREATE POLICY "Users can view agents in their organizations" ON agents
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create agents in their organizations" ON agents
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update agents in their organizations" ON agents
    FOR UPDATE USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete agents in their organizations" ON agents
    FOR DELETE USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

-- Agent sessions policies (public for widget)
CREATE POLICY "Anyone can view agent sessions" ON agent_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create agent sessions" ON agent_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update agent sessions" ON agent_sessions
    FOR UPDATE USING (true);

-- Agent messages policies (public for widget)
CREATE POLICY "Anyone can view agent messages" ON agent_messages
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create agent messages" ON agent_messages
    FOR INSERT WITH CHECK (true);

-- Usage logs policies
CREATE POLICY "Users can view usage logs for their organizations" ON usage_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- Step 11: Create triggers
-- =====================================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;

-- Create triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    
    -- Create default organization
    INSERT INTO public.organizations (name, owner_id)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Organization'), NEW.id)
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DONE! Tables fixed and ready to use.
-- =====================================================
