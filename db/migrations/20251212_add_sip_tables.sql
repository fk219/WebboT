-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- SIP Trunks
create table if not exists sip_trunks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null, -- references organizations(id)
  provider text not null, -- 'twilio', 'telnyx', 'livekit'
  username text,
  password text,
  sip_domain text,
  created_at timestamptz default now()
);

-- Phone Numbers (Mapping to Agents)
create table if not exists phone_numbers (
  id uuid primary key default uuid_generate_v4(),
  phone_number text unique not null,
  agent_id uuid not null, -- references agents(id)
  sip_trunk_id uuid references sip_trunks(id),
  created_at timestamptz default now()
);

-- Call Logs
create table if not exists call_logs (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid not null, -- references agents(id)
  session_id text not null,
  direction text not null, -- 'inbound', 'outbound'
  caller_number text,
  duration_seconds int default 0,
  recording_url text,
  status text, -- 'completed', 'failed', 'busy', 'active'
  created_at timestamptz default now()
);

-- Add RLS Policies (Optional - adjust as needed)
alter table sip_trunks enable row level security;
alter table phone_numbers enable row level security;
alter table call_logs enable row level security;

-- Simple policy: allow all for now (dev mode)
create policy "Allow all access to sip_trunks" on sip_trunks for all using (true);
create policy "Allow all access to phone_numbers" on phone_numbers for all using (true);
create policy "Allow all access to call_logs" on call_logs for all using (true);
