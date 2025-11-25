-- =====================================================
-- FRESH START: Create everything from scratch
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CREATE AGENTS TABLE (not bots)
-- =====================================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
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
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    
    -- Full config backup
    config_json JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE AGENT_SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Isolation
    user_id UUID,
    website_domain VARCHAR(255),
    ip_address VARCHAR(45),
    
    -- Channel
    channel VARCHAR(50) NOT NULL DEFAULT 'text',
    
    -- Conversation state
    message_count INTEGER DEFAULT 0,
    conversation_history JSONB DEFAULT '[]'::jsonb,
    context_data JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 3. CREATE AGENT_MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    
    -- Message
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    
    -- Audio (for voice)
    audio_url TEXT,
    audio_duration_ms INTEGER,
    
    -- Metadata
    tokens_used INTEGER,
    latency_ms INTEGER,
    model_used VARCHAR(100),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_agents_organization ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_published ON agents(is_published);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_session_id ON agent_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_id ON agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_last_activity ON agent_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_agent_messages_session_id ON agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON agent_messages(created_at);

-- =====================================================
-- 5. ENABLE RLS
-- =====================================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Agents policies
CREATE POLICY "Users can view agents in their organizations" ON agents
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create agents in their organizations" ON agents
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update agents in their organizations" ON agents
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete agents in their organizations" ON agents
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Agent sessions policies
CREATE POLICY "Anyone can create agent sessions" ON agent_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view sessions for their agents" ON agent_sessions
    FOR SELECT USING (
        agent_id IN (
            SELECT id FROM agents 
            WHERE organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Agent messages policies
CREATE POLICY "Anyone can insert agent messages" ON agent_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view messages for their agent sessions" ON agent_messages
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM agent_sessions 
            WHERE agent_id IN (
                SELECT id FROM agents 
                WHERE organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- =====================================================
-- 7. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at 
    BEFORE UPDATE ON agents
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup inactive sessions
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions(inactive_hours INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    UPDATE agent_sessions 
    SET status = 'timeout', ended_at = NOW()
    WHERE status = 'active' 
    AND last_activity_at < NOW() - INTERVAL '1 hour' * inactive_hours;
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONE!
-- =====================================================

SELECT 'Fresh start complete! Tables created: agents, agent_sessions, agent_messages' as result;
