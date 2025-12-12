-- =====================================================
-- MASTER DATABASE SCHEMA
-- =====================================================
-- This file contains the complete database structure for the LangGraph Agent Platform.
-- Run this to recreate the database from scratch.
-- Includes: Organizations, Users, Agents, Sessions, SIP, Billing.

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ORGANIZATIONS (Multi-Tenancy Core)
create table if not exists organizations (
    id uuid primary key default uuid_generate_v4(),
    name varchar(255) not null,
    owner_id uuid not null references auth.users(id) on delete cascade,
    credits_balance decimal(10, 2) default 0.00,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. USER PROFILES
create table if not exists user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email varchar(255) not null unique,
    full_name varchar(255),
    company_name varchar(255),
    phone_number varchar(50),
    avatar_url text,
    subscription_tier varchar(50) default 'free',
    stripe_customer_id varchar(255),
    stripe_subscription_id varchar(255),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4. AGENTS (AI Configurations)
create table if not exists agents (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid not null references organizations(id) on delete cascade,
    name varchar(255) not null,
    description text,
    
    -- LLM Configuration
    llm_provider varchar(50) default 'openai',
    llm_model varchar(100) default 'gpt-4o-mini',
    system_prompt text,
    temperature decimal(3,2) default 0.7,
    max_tokens integer default 1000,
    
    -- Voice Configuration
    voice_provider varchar(50),
    voice_id varchar(255),
    voice_model varchar(100),
    voice_speed decimal(3,2) default 1.0,
    voice_temperature decimal(3,2) default 1.0,
    voice_volume decimal(3,2) default 1.0,
    
    -- Speech Processing
    responsiveness decimal(3,2) default 1.0,
    interruption_sensitivity decimal(3,2) default 1.0,
    enable_backchannel boolean default true,
    backchannel_words jsonb default '["mm-hmm", "yeah", "uh-huh"]'::jsonb,
    normalize_speech boolean default true,
    boosted_keywords jsonb default '[]'::jsonb,
    
    -- Environment
    ambient_sound varchar(50) default 'none',
    ambient_volume decimal(3,2) default 0.5,
    
    -- Call Settings
    max_duration_seconds integer default 1800,
    end_after_silence_seconds integer default 600,
    voicemail_detection boolean default false,
    voicemail_action varchar(20) default 'hangup',
    voicemail_message text,
    
    -- Transcription
    stt_provider varchar(50) default 'whisper',
    stt_mode varchar(20) default 'fast',
    denoising_mode varchar(50) default 'noise-cancellation',
    
    -- Security & Privacy
    pii_redaction_enabled boolean default false,
    pii_redaction_list jsonb default '[]'::jsonb,
    data_storage_policy varchar(50) default 'everything',
    
    -- Integration
    webhook_url text,
    webhook_timeout_ms integer default 5000,
    custom_headers jsonb default '{}'::jsonb,
    
    -- MCP Tools
    enabled_mcp_servers jsonb default '[]'::jsonb,
    
    -- Knowledge Base
    knowledge_base_ids jsonb default '[]'::jsonb,
    
    -- Status
    is_published boolean default false,
    version integer default 1,
    
    -- Config JSON (for full backup)
    config jsonb,
    
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 5. SIP TRUNKS & PHONE NUMBERS
create table if not exists sip_trunks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  provider text not null, -- 'twilio', 'telnyx', 'livekit'
  username text,
  password text,
  sip_domain text,
  created_at timestamptz default now()
);

create table if not exists phone_numbers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  agent_id uuid references agents(id) on delete set null,
  phone_number text unique not null,
  provider text default 'twilio',
  provider_sid text,
  status text default 'active', -- 'active', 'released'
  created_at timestamptz default now()
);

-- 6. AGENT SESSIONS (Backend / LangGraph)
create table if not exists agent_sessions (
    id uuid primary key default uuid_generate_v4(),
    agent_id uuid not null references agents(id) on delete cascade,
    session_id varchar(255) unique not null,
    user_id uuid references auth.users(id) on delete set null,
    website_domain varchar(255),
    ip_address varchar(45),
    channel varchar(50) default 'text',
    conversation_history jsonb default '[]'::jsonb,
    context_data jsonb default '{}'::jsonb,
    message_count integer default 0,
    status varchar(50) default 'active',
    started_at timestamptz default now(),
    last_activity_at timestamptz default now(),
    ended_at timestamptz,
    created_at timestamptz default now()
);

create table if not exists agent_messages (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid not null references agent_sessions(id) on delete cascade,
    role varchar(20) not null check (role in ('user', 'assistant', 'system')),
    content text not null,
    audio_url text,
    audio_duration_ms integer,
    tokens_used integer,
    latency_ms integer,
    model_used varchar(100),
    created_at timestamptz default now()
);

-- 7. CHAT SESSIONS (Legacy / Frontend Compatibility)
-- Kept because frontend services currently query these tables directly in some places
create table if not exists chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references agents(id) not null, -- Maps to agents table now
  user_id uuid references user_profiles(id),
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  text text not null,
  timestamp timestamptz default now()
);

-- 8. LOGS & BILLING
create table if not exists usage_logs (
    id uuid primary key default uuid_generate_v4(),
    agent_id uuid not null references agents(id) on delete cascade,
    session_id uuid references agent_sessions(id) on delete set null,
    organization_id uuid not null references organizations(id) on delete cascade,
    tokens_used integer default 0,
    cost_usd decimal(10,4) default 0,
    model_used varchar(100),
    channel varchar(50),
    created_at timestamptz default now()
);

create table if not exists call_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  agent_id uuid references agents(id) on delete set null,
  phone_number_id uuid references phone_numbers(id) on delete set null,
  session_id text not null,
  direction text not null, -- 'inbound', 'outbound'
  caller_number text,
  duration_seconds int default 0,
  cost decimal(10, 4) default 0.0000,
  recording_url text,
  status text, -- 'completed', 'failed', 'busy', 'active'
  created_at timestamptz default now()
);

-- 9. RLS POLICIES
-- Enable RLS
alter table organizations enable row level security;
alter table user_profiles enable row level security;
alter table agents enable row level security;
alter table agent_sessions enable row level security;
alter table agent_messages enable row level security;
alter table usage_logs enable row level security;
alter table sip_trunks enable row level security;
alter table phone_numbers enable row level security;
alter table call_logs enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

-- Organizations
create policy "Users can view their own organizations" on organizations for select using (auth.uid() = owner_id);
create policy "Users can create organizations" on organizations for insert with check (auth.uid() = owner_id);
create policy "Users can update their own organizations" on organizations for update using (auth.uid() = owner_id);
create policy "Users can delete their own organizations" on organizations for delete using (auth.uid() = owner_id);

-- User Profiles
create policy "Users can view their own profile" on user_profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on user_profiles for update using (auth.uid() = id);

-- Agents
create policy "Users can view agents in their organizations" on agents for select using (organization_id in (select id from organizations where owner_id = auth.uid()));
create policy "Users can create agents in their organizations" on agents for insert with check (organization_id in (select id from organizations where owner_id = auth.uid()));
create policy "Users can update agents in their organizations" on agents for update using (organization_id in (select id from organizations where owner_id = auth.uid()));
create policy "Users can delete agents in their organizations" on agents for delete using (organization_id in (select id from organizations where owner_id = auth.uid()));

-- Phone Numbers
create policy "Users can view own org phone numbers" on phone_numbers for select using (organization_id in (select id from organizations where owner_id = auth.uid()));
create policy "Users can insert own org phone numbers" on phone_numbers for insert with check (organization_id in (select id from organizations where owner_id = auth.uid()));
create policy "Users can update own org phone numbers" on phone_numbers for update using (organization_id in (select id from organizations where owner_id = auth.uid()));
create policy "Users can delete own org phone numbers" on phone_numbers for delete using (organization_id in (select id from organizations where owner_id = auth.uid()));

-- SIP Trunks
create policy "Users can view own org sip trunks" on sip_trunks for select using (organization_id in (select id from organizations where owner_id = auth.uid()));
create policy "Users can insert own org sip trunks" on sip_trunks for insert with check (organization_id in (select id from organizations where owner_id = auth.uid()));
create policy "Users can update own org sip trunks" on sip_trunks for update using (organization_id in (select id from organizations where owner_id = auth.uid()));
create policy "Users can delete own org sip trunks" on sip_trunks for delete using (organization_id in (select id from organizations where owner_id = auth.uid()));

-- Call Logs
create policy "Users can view own org call logs" on call_logs for select using (organization_id in (select id from organizations where owner_id = auth.uid()));

-- Usage Logs
create policy "Users can view usage logs for their organizations" on usage_logs for select using (organization_id in (select id from organizations where owner_id = auth.uid()));

-- Agent Sessions/Messages (Public for widget, Auth for management)
create policy "Anyone can view agent sessions" on agent_sessions for select using (true);
create policy "Anyone can create agent sessions" on agent_sessions for insert with check (true);
create policy "Anyone can update agent sessions" on agent_sessions for update using (true);
create policy "Anyone can view agent messages" on agent_messages for select using (true);
create policy "Anyone can create agent messages" on agent_messages for insert with check (true);

-- Chat Sessions/Messages (Legacy)
create policy "Anyone can create chat sessions" on chat_sessions for insert with check (true);
create policy "Users can view sessions for their projects" on chat_sessions for select using (exists (select 1 from agents where agents.id = chat_sessions.project_id and agents.organization_id in (select id from organizations where owner_id = auth.uid())));
create policy "Anyone can insert chat messages" on chat_messages for insert with check (true);
create policy "Users can view messages for their project sessions" on chat_messages for select using (exists (select 1 from chat_sessions join agents on agents.id = chat_sessions.project_id where chat_sessions.id = chat_messages.session_id and agents.organization_id in (select id from organizations where owner_id = auth.uid())));

-- 10. TRIGGERS
-- Update updated_at
create or replace function update_updated_at_column() returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_organizations_updated_at before update on organizations for each row execute function update_updated_at_column();
create trigger update_user_profiles_updated_at before update on user_profiles for each row execute function update_updated_at_column();
create trigger update_agents_updated_at before update on agents for each row execute function update_updated_at_column();

-- Handle New User
create or replace function public.handle_new_user() returns trigger as $$
begin
    insert into public.user_profiles (id, email, full_name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name');
    
    insert into public.organizations (name, owner_id)
    values (coalesce(new.raw_user_meta_data->>'company_name', 'My Organization'), new.id);
    
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
