-- FIXED MIGRATION: Organizations → Bots Architecture
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- STEP 1: Create Organizations Table
-- ============================================
create table if not exists public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- STEP 2: Create Organization Members Table
-- ============================================
create table if not exists public.organization_members (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, user_id)
);

-- ============================================
-- STEP 3: Create Bots Table
-- ============================================
create table if not exists public.bots (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  description text,
  config jsonb not null default '{}'::jsonb,
  is_active boolean default true,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- STEP 4: Enable RLS on Organizations
-- ============================================
alter table public.organizations enable row level security;

drop policy if exists "Users can view their organizations" on public.organizations;
create policy "Users can view their organizations" on public.organizations
  for select using (
    auth.uid() = owner_id OR
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = organizations.id
      and organization_members.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create organizations" on public.organizations;
create policy "Users can create organizations" on public.organizations
  for insert with check (auth.uid() = owner_id);

drop policy if exists "Organization owners can update" on public.organizations;
create policy "Organization owners can update" on public.organizations
  for update using (auth.uid() = owner_id);

drop policy if exists "Organization owners can delete" on public.organizations;
create policy "Organization owners can delete" on public.organizations
  for delete using (auth.uid() = owner_id);

-- ============================================
-- STEP 5: Enable RLS on Organization Members
-- ============================================
alter table public.organization_members enable row level security;

drop policy if exists "Users can view org members" on public.organization_members;
create policy "Users can view org members" on public.organization_members
  for select using (
    exists (
      select 1 from public.organizations
      where organizations.id = organization_members.organization_id
      and (organizations.owner_id = auth.uid() OR organization_members.user_id = auth.uid())
    )
  );

drop policy if exists "Organization owners can manage members" on public.organization_members;
create policy "Organization owners can manage members" on public.organization_members
  for all using (
    exists (
      select 1 from public.organizations
      where organizations.id = organization_members.organization_id
      and organizations.owner_id = auth.uid()
    )
  );

-- ============================================
-- STEP 6: Enable RLS on Bots
-- ============================================
alter table public.bots enable row level security;

drop policy if exists "Users can view bots in their orgs" on public.bots;
create policy "Users can view bots in their orgs" on public.bots
  for select using (
    exists (
      select 1 from public.organizations
      where organizations.id = bots.organization_id
      and (
        organizations.owner_id = auth.uid() OR
        exists (
          select 1 from public.organization_members
          where organization_members.organization_id = organizations.id
          and organization_members.user_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "Org members can create bots" on public.bots;
create policy "Org members can create bots" on public.bots
  for insert with check (
    exists (
      select 1 from public.organizations
      where organizations.id = bots.organization_id
      and (
        organizations.owner_id = auth.uid() OR
        exists (
          select 1 from public.organization_members
          where organization_members.organization_id = organizations.id
          and organization_members.user_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "Org members can update bots" on public.bots;
create policy "Org members can update bots" on public.bots
  for update using (
    exists (
      select 1 from public.organizations
      where organizations.id = bots.organization_id
      and (
        organizations.owner_id = auth.uid() OR
        exists (
          select 1 from public.organization_members
          where organization_members.organization_id = organizations.id
          and organization_members.user_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "Org owners can delete bots" on public.bots;
create policy "Org owners can delete bots" on public.bots
  for delete using (
    exists (
      select 1 from public.organizations
      where organizations.id = bots.organization_id
      and organizations.owner_id = auth.uid()
    )
  );

-- ============================================
-- STEP 7: Create Indexes
-- ============================================
create index if not exists idx_organizations_owner on public.organizations(owner_id);
create index if not exists idx_organization_members_org on public.organization_members(organization_id);
create index if not exists idx_organization_members_user on public.organization_members(user_id);
create index if not exists idx_bots_organization on public.bots(organization_id);
create index if not exists idx_bots_created_by on public.bots(created_by);

-- ============================================
-- STEP 8: Migrate Existing Data
-- ============================================

-- Create default organization for each user who has projects
insert into public.organizations (name, owner_id, description)
select 
  'My Organization',
  user_id,
  'Default organization'
from public.projects
group by user_id
on conflict do nothing;

-- Convert projects to bots
insert into public.bots (id, organization_id, name, config, created_by, created_at, is_active)
select 
  p.id,
  o.id as organization_id,
  p.name,
  p.config,
  p.user_id as created_by,
  p.created_at,
  true as is_active
from public.projects p
join public.organizations o on o.owner_id = p.user_id
where o.name = 'My Organization'
on conflict do nothing;

-- ============================================
-- STEP 9: Update Foreign Keys in Related Tables
-- ============================================

-- Check if bot_id column exists in usage_logs, if not rename from project_id
do $$ 
begin
  if exists (select 1 from information_schema.columns where table_name = 'usage_logs' and column_name = 'project_id') then
    alter table public.usage_logs rename column project_id to bot_id;
  end if;
end $$;

-- Update usage_logs foreign key
alter table public.usage_logs 
  drop constraint if exists usage_logs_project_id_fkey;
alter table public.usage_logs 
  drop constraint if exists usage_logs_bot_id_fkey;
alter table public.usage_logs 
  add constraint usage_logs_bot_id_fkey 
  foreign key (bot_id) 
  references public.bots(id) 
  on delete cascade;

-- Check if bot_id column exists in chat_sessions, if not rename from project_id
do $$ 
begin
  if exists (select 1 from information_schema.columns where table_name = 'chat_sessions' and column_name = 'project_id') then
    alter table public.chat_sessions rename column project_id to bot_id;
  end if;
end $$;

-- Update chat_sessions foreign key
alter table public.chat_sessions 
  drop constraint if exists chat_sessions_project_id_fkey;
alter table public.chat_sessions 
  drop constraint if exists chat_sessions_bot_id_fkey;
alter table public.chat_sessions 
  add constraint chat_sessions_bot_id_fkey 
  foreign key (bot_id) 
  references public.bots(id) 
  on delete cascade;

-- Create index on bot_id columns
create index if not exists idx_usage_logs_bot on public.usage_logs(bot_id);
create index if not exists idx_chat_sessions_bot on public.chat_sessions(bot_id);

-- ============================================
-- STEP 10: Create Function for Auto-Creating Org
-- ============================================

create or replace function public.create_default_organization()
returns trigger as $$
begin
  insert into public.organizations (name, owner_id, description)
  values ('My Organization', new.id, 'Default organization');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.create_default_organization();

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- Next steps:
-- 1. Verify data migrated correctly
-- 2. Test creating new organizations
-- 3. Test creating new bots
-- 4. Update frontend code
