-- NEW ARCHITECTURE: Organizations → Bots
-- This replaces the old Projects system with Organizations and Bots

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.organizations enable row level security;

-- Policies
create policy "Users can view organizations they own or are members of" on public.organizations
  for select using (
    auth.uid() = owner_id OR
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = organizations.id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Users can create organizations" on public.organizations
  for insert with check (auth.uid() = owner_id);

create policy "Organization owners can update their organizations" on public.organizations
  for update using (auth.uid() = owner_id);

create policy "Organization owners can delete their organizations" on public.organizations
  for delete using (auth.uid() = owner_id);

-- ============================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================
create table public.organization_members (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, user_id)
);

-- Enable RLS
alter table public.organization_members enable row level security;

-- Policies
create policy "Users can view members of their organizations" on public.organization_members
  for select using (
    exists (
      select 1 from public.organizations
      where organizations.id = organization_members.organization_id
      and (organizations.owner_id = auth.uid() OR organization_members.user_id = auth.uid())
    )
  );

create policy "Organization owners can manage members" on public.organization_members
  for all using (
    exists (
      select 1 from public.organizations
      where organizations.id = organization_members.organization_id
      and organizations.owner_id = auth.uid()
    )
  );

-- ============================================
-- BOTS TABLE (replaces projects)
-- ============================================
create table public.bots (
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

-- Enable RLS
alter table public.bots enable row level security;

-- Policies
create policy "Users can view bots in their organizations" on public.bots
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

create policy "Organization members can create bots" on public.bots
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

create policy "Organization members can update bots" on public.bots
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

create policy "Organization owners can delete bots" on public.bots
  for delete using (
    exists (
      select 1 from public.organizations
      where organizations.id = bots.organization_id
      and organizations.owner_id = auth.uid()
    )
  );

-- ============================================
-- UPDATE EXISTING TABLES
-- ============================================

-- Update usage_logs to reference bots instead of projects
alter table public.usage_logs 
  drop constraint if exists usage_logs_project_id_fkey;

alter table public.usage_logs 
  rename column project_id to bot_id;

alter table public.usage_logs 
  add constraint usage_logs_bot_id_fkey 
  foreign key (bot_id) 
  references public.bots(id) 
  on delete cascade;

-- Update chat_sessions to reference bots instead of projects
alter table public.chat_sessions 
  drop constraint if exists chat_sessions_project_id_fkey;

alter table public.chat_sessions 
  rename column project_id to bot_id;

alter table public.chat_sessions 
  add constraint chat_sessions_bot_id_fkey 
  foreign key (bot_id) 
  references public.bots(id) 
  on delete cascade;

-- ============================================
-- MIGRATION: Convert existing projects to bots
-- ============================================

-- Create default organization for each user
insert into public.organizations (name, owner_id, description)
select 
  'My Organization',
  user_id,
  'Default organization'
from public.projects
group by user_id
on conflict do nothing;

-- Convert projects to bots
insert into public.bots (id, organization_id, name, config, created_by, created_at)
select 
  p.id,
  o.id as organization_id,
  p.name,
  p.config,
  p.user_id as created_by,
  p.created_at
from public.projects p
join public.organizations o on o.owner_id = p.user_id
on conflict do nothing;

-- ============================================
-- INDEXES for performance
-- ============================================
create index idx_organizations_owner on public.organizations(owner_id);
create index idx_organization_members_org on public.organization_members(organization_id);
create index idx_organization_members_user on public.organization_members(user_id);
create index idx_bots_organization on public.bots(organization_id);
create index idx_bots_created_by on public.bots(created_by);
create index idx_usage_logs_bot on public.usage_logs(bot_id);
create index idx_chat_sessions_bot on public.chat_sessions(bot_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create organization for new users
create or replace function public.create_default_organization()
returns trigger as $$
begin
  insert into public.organizations (name, owner_id, description)
  values ('My Organization', new.id, 'Default organization');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create default organization
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.create_default_organization();

-- ============================================
-- NOTES
-- ============================================
-- After running this migration:
-- 1. All existing projects become bots
-- 2. Each user gets a default organization
-- 3. All bots are assigned to their user's organization
-- 4. Old projects table can be dropped after verification
