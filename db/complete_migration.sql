-- =====================================================
-- COMPLETE MIGRATION FOR LANGGRAPH + SESSION MANAGEMENT
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Rename tables to match Python models
ALTER TABLE bots RENAME TO agents;
ALTER TABLE chat_sessions RENAME TO agent_sessions;
ALTER TABLE chat_messages RENAME TO agent_messages;

-- Step 2: Update foreign key references
ALTER TABLE agent_sessions RENAME COLUMN bot_id TO agent_id;
ALTER TABLE usage_logs RENAME COLUMN bot_id TO agent_id;

-- Step 3: Rename columns in agent_messages
ALTER TABLE agent_messages RENAME COLUMN text TO content;
ALTER TABLE agent_messages RENAME COLUMN timestamp TO created_at;

-- Step 4: Add session isolation fields to agent_sessions
ALTER TABLE agent_sessions ADD COLUMN IF NOT EXISTS session_id VARCHAR(255) UNIQUE;
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

-- Step 5: Add voice & metadata fields to agent_messages
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS audio_duration_ms INTEGER;
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS tokens_used INTEGER;
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS latency_ms INTEGER;
ALTER TABLE agent_messages ADD COLUMN IF NOT EXISTS model_used VARCHAR(100);

-- Step 6: Add LangGraph fields to agents table
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

-- Config JSON (for full backup)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS config_json JSONB;

-- Step 7: Migrate existing config to config_json
UPDATE agents SET config_json = config WHERE config_json IS NULL;

-- Step 8: Generate session_id for existing sessions
UPDATE agent_sessions 
SET session_id = 'session_' || id::text 
WHERE session_id IS NULL;

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_sessions_session_id ON agent_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_id ON agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_last_activity ON agent_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_agent_messages_session_id ON agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON agent_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_agents_organization ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_published ON agents(is_published);

-- Step 10: Update RLS policies for renamed tables
DROP POLICY IF EXISTS "Users can view bots in their organizations" ON agents;
DROP POLICY IF EXISTS "Organization members can create bots" ON agents;
DROP POLICY IF EXISTS "Organization members can update bots" ON agents;
DROP POLICY IF EXISTS "Organization owners can delete bots" ON agents;

CREATE POLICY "Users can view agents in their organizations" ON agents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = agents.organization_id
      AND (
        organizations.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = organizations.id
          AND organization_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Organization members can create agents" ON agents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = agents.organization_id
      AND (
        organizations.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = organizations.id
          AND organization_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Organization members can update agents" ON agents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = agents.organization_id
      AND (
        organizations.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = organizations.id
          AND organization_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Organization owners can delete agents" ON agents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = agents.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

-- Update policies for agent_sessions
DROP POLICY IF EXISTS "Anyone can create chat sessions." ON agent_sessions;
DROP POLICY IF EXISTS "Users can view sessions for their projects." ON agent_sessions;

CREATE POLICY "Anyone can create agent sessions" ON agent_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view sessions for their agents" ON agent_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents
      JOIN organizations ON organizations.id = agents.organization_id
      WHERE agents.id = agent_sessions.agent_id
      AND (
        organizations.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = organizations.id
          AND organization_members.user_id = auth.uid()
        )
      )
    )
  );

-- Update policies for agent_messages
DROP POLICY IF EXISTS "Anyone can insert chat messages." ON agent_messages;
DROP POLICY IF EXISTS "Users can view messages for their project sessions." ON agent_messages;

CREATE POLICY "Anyone can insert agent messages" ON agent_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view messages for their agent sessions" ON agent_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agent_sessions
      JOIN agents ON agents.id = agent_sessions.agent_id
      JOIN organizations ON organizations.id = agents.organization_id
      WHERE agent_sessions.id = agent_messages.session_id
      AND (
        organizations.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = organizations.id
          AND organization_members.user_id = auth.uid()
        )
      )
    )
  );

-- Step 11: Create helper function for session cleanup
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

-- Step 12: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at 
    BEFORE UPDATE ON agents
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================

SELECT 'Migration completed successfully! Your database is now ready for LangGraph + Session Management.' as result;
