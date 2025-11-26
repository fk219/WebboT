-- =====================================================
-- INITIAL TABLE CREATION FOR LANGGRAPH AGENT PLATFORM
-- Run this FIRST in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================
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
-- AGENTS TABLE (formerly bots)
-- =====================================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- LLM Configuration
    llm_provider VARCHAR(50) DEFAULT 'openai',
    llm_model VARCHAR(100) DEFAULT 'gpt-4o-mini',
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    
    -- Voice Configuration
    voice_provider VARCHAR(50),
    voice_id VARCHAR(255),
    voice_model VARCHAR(100),
    voice_speed DECIMAL(3,2) DEFAULT 1.0,
    voice_temperature DECIMAL(3,2) DEFAULT 1.0,
    voice_volume DECIMAL(3,2) DEFAULT 1.0,
    
    -- Speech Processing
    responsiveness DECIMAL(3,2) DEFAULT 1.0,
    interruption_sensitivity DECIMAL(3,2) DEFAULT 1.0,
    enable_backchannel BOOLEAN DEFAULT true,
    backchannel_words JSONB DEFAULT '["mm-hmm", "yeah", "uh-huh"]'::jsonb,
    normalize_speech BOOLEAN DEFAULT true,
    boosted_keywords JSONB DEFAULT '[]'::jsonb,
    
    -- Environment
    ambient_sound VARCHAR(50) DEFAULT 'none',
    ambient_volume DECIMAL(3,2) DEFAULT 0.5,
    
    -- Call Settings
    max_duration_seconds INTEGER DEFAULT 1800,
    end_after_silence_seconds INTEGER DEFAULT 600,
    voicemail_detection BOOLEAN DEFAULT false,
    voicemail_action VARCHAR(20) DEFAULT 'hangup',
    voicemail_message TEXT,
    
    -- Transcription
    stt_provider VARCHAR(50) DEFAULT 'whisper',
    stt_mode VARCHAR(20) DEFAULT 'fast',
    denoising_mode VARCHAR(50) DEFAULT 'noise-cancellation',
    
    -- Security & Privacy
    pii_redaction_enabled BOOLEAN DEFAULT false,
    pii_redaction_list JSONB DEFAULT '[]'::jsonb,
    data_storage_policy VARCHAR(50) DEFAULT 'everything',
    
    -- Integration
    webhook_url TEXT,
    webhook_timeout_ms INTEGER DEFAULT 5000,
    custom_headers JSONB DEFAULT '{}'::jsonb,
    
    -- MCP Tools
    enabled_mcp_servers JSONB DEFAULT '[]'::jsonb,
    
    -- Knowledge Base
    knowledge_base_ids JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    is_published BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    
    -- Config JSON (for full backup)
    config JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AGENT SESSIONS TABLE (formerly chat_sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    website_domain VARCHAR(255),
    ip_address VARCHAR(45),
    channel VARCHAR(50) DEFAULT 'text',
    conversation_history JSONB DEFAULT '[]'::jsonb,
    context_data JSONB DEFAULT '{}'::jsonb,
    message_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AGENT MESSAGES TABLE (formerly chat_messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    audio_url TEXT,
    audio_duration_ms INTEGER,
    tokens_used INTEGER,
    latency_ms INTEGER,
    model_used VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USAGE LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    session_id UUID REFERENCES agent_sessions(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,4) DEFAULT 0,
    model_used VARCHAR(100),
    channel VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_agents_organization ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent ON agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_session_id ON agent_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_session ON agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_agent ON usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_organization ON usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organizations
CREATE POLICY "Users can view their own organizations" ON organizations
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own organizations" ON organizations
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own organizations" ON organizations
    FOR DELETE USING (auth.uid() = owner_id);

-- User Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Agents: Users can only see agents in their organizations
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

-- Agent Sessions: Allow public read for widget, authenticated write
CREATE POLICY "Anyone can view agent sessions" ON agent_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create agent sessions" ON agent_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update agent sessions" ON agent_sessions
    FOR UPDATE USING (true);

-- Agent Messages: Allow public read/write for widget
CREATE POLICY "Anyone can view agent messages" ON agent_messages
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create agent messages" ON agent_messages
    FOR INSERT WITH CHECK (true);

-- Usage Logs: Only organization owners can view
CREATE POLICY "Users can view usage logs for their organizations" ON usage_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
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
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    -- Create default organization
    INSERT INTO public.organizations (name, owner_id)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Organization'), NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DONE!
-- =====================================================
-- Tables created successfully!
-- You can now use the application.
