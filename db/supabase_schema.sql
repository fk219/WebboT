
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'enterprise')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- PROJECTS TABLE
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.projects enable row level security;

-- Policies
create policy "Users can view own projects." on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can create projects." on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects." on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects." on public.projects
  for delete using (auth.uid() = user_id);

-- USAGE LOGS TABLE
create table public.usage_logs (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) not null,
  user_id uuid references public.profiles(id) not null,
  tokens_used integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.usage_logs enable row level security;

-- Policies
create policy "Users can view own usage." on public.usage_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert usage." on public.usage_logs
  for insert with check (auth.uid() = user_id);

-- CHAT SESSIONS TABLE
create table public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) not null,
  user_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.chat_sessions enable row level security;

-- Policies
create policy "Anyone can create chat sessions." on public.chat_sessions
  for insert with check (true);

create policy "Users can view sessions for their projects." on public.chat_sessions
  for select using (
    exists (
      select 1 from public.projects
      where projects.id = chat_sessions.project_id
      and projects.user_id = auth.uid()
    )
  );

-- CHAT MESSAGES TABLE
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  text text not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Policies
create policy "Anyone can insert chat messages." on public.chat_messages
  for insert with check (true);

create policy "Users can view messages for their project sessions." on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_sessions
      join public.projects on projects.id = chat_sessions.project_id
      where chat_sessions.id = chat_messages.session_id
      and projects.user_id = auth.uid()
    )
  );

-- TRIGGER FOR NEW USERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
