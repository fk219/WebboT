-- FIX RLS POLICIES
-- Run this in Supabase SQL Editor to unblock the widget

-- ============================================
-- CHAT SESSIONS
-- ============================================
alter table public.chat_sessions enable row level security;

-- Allow anyone to create a session (needed for anonymous widget users)
drop policy if exists "Allow public insert for chat_sessions" on public.chat_sessions;
create policy "Allow public insert for chat_sessions" on public.chat_sessions for insert with check (true);

-- Allow anyone to read sessions (needed for widget history)
-- WARNING: In production, you should restrict this to the session owner or bot owner
drop policy if exists "Allow public select for chat_sessions" on public.chat_sessions;
create policy "Allow public select for chat_sessions" on public.chat_sessions for select using (true);

-- Allow updates (e.g. closing session)
drop policy if exists "Allow public update for chat_sessions" on public.chat_sessions;
create policy "Allow public update for chat_sessions" on public.chat_sessions for update using (true);

-- ============================================
-- CHAT MESSAGES
-- ============================================
alter table public.chat_messages enable row level security;

-- Allow anyone to send a message
drop policy if exists "Allow public insert for chat_messages" on public.chat_messages;
create policy "Allow public insert for chat_messages" on public.chat_messages for insert with check (true);

-- Allow anyone to read messages
drop policy if exists "Allow public select for chat_messages" on public.chat_messages;
create policy "Allow public select for chat_messages" on public.chat_messages for select using (true);

-- ============================================
-- USAGE LOGS
-- ============================================
alter table public.usage_logs enable row level security;

-- Allow recording usage
drop policy if exists "Allow public insert for usage_logs" on public.usage_logs;
create policy "Allow public insert for usage_logs" on public.usage_logs for insert with check (true);

-- Allow reading usage
drop policy if exists "Allow public select for usage_logs" on public.usage_logs;
create policy "Allow public select for usage_logs" on public.usage_logs for select using (true);
