-- ==============================================================================
-- SIP & LiveKit Integration Migration (Consolidated)
-- Includes: SIP Trunks, Phone Numbers, Call Logs, and Organization Credits
-- ==============================================================================

-- 1. Enable UUID extension (if not already enabled)
create extension if not exists "uuid-ossp";

-- 2. Add credits_balance to organizations
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'organizations' and column_name = 'credits_balance') then
        alter table organizations add column credits_balance decimal(10, 2) default 0.00;
    end if;
end $$;

-- 3. SIP Trunks
-- Stores credentials for SIP providers (Twilio, Telnyx, etc.)
create table if not exists sip_trunks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  provider text not null, -- 'twilio', 'telnyx', 'livekit'
  username text,
  password text,
  sip_domain text,
  created_at timestamptz default now()
);

-- 4. Phone Numbers
-- Maps incoming numbers to Agents and Organizations
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

-- 5. Call Logs
-- Records all inbound/outbound calls for billing and history
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

-- 6. Row Level Security (RLS) Policies

-- Enable RLS
alter table sip_trunks enable row level security;
alter table phone_numbers enable row level security;
alter table call_logs enable row level security;

-- Phone Numbers Policies
create policy "Users can view own org phone numbers" on phone_numbers
  for select using (
    organization_id in (select id from organizations where owner_id = auth.uid())
  );

create policy "Users can insert own org phone numbers" on phone_numbers
  for insert with check (
    organization_id in (select id from organizations where owner_id = auth.uid())
  );

create policy "Users can update own org phone numbers" on phone_numbers
  for update using (
    organization_id in (select id from organizations where owner_id = auth.uid())
  );

create policy "Users can delete own org phone numbers" on phone_numbers
  for delete using (
    organization_id in (select id from organizations where owner_id = auth.uid())
  );

-- Call Logs Policies
create policy "Users can view own org call logs" on call_logs
  for select using (
    organization_id in (select id from organizations where owner_id = auth.uid())
  );

-- SIP Trunks Policies
create policy "Users can view own org sip trunks" on sip_trunks
  for select using (
    organization_id in (select id from organizations where owner_id = auth.uid())
  );

create policy "Users can insert own org sip trunks" on sip_trunks
  for insert with check (
    organization_id in (select id from organizations where owner_id = auth.uid())
  );

create policy "Users can update own org sip trunks" on sip_trunks
  for update using (
    organization_id in (select id from organizations where owner_id = auth.uid())
  );

create policy "Users can delete own org sip trunks" on sip_trunks
  for delete using (
    organization_id in (select id from organizations where owner_id = auth.uid())
  );
