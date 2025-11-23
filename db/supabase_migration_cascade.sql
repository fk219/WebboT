-- Migration to add CASCADE delete for project dependencies
-- This fixes the 409 conflict error when deleting projects

-- Drop existing foreign key constraints
ALTER TABLE public.usage_logs 
  DROP CONSTRAINT IF EXISTS usage_logs_project_id_fkey;

ALTER TABLE public.chat_sessions 
  DROP CONSTRAINT IF EXISTS chat_sessions_project_id_fkey;

-- Re-add with CASCADE delete
ALTER TABLE public.usage_logs 
  ADD CONSTRAINT usage_logs_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES public.projects(id) 
  ON DELETE CASCADE;

ALTER TABLE public.chat_sessions 
  ADD CONSTRAINT chat_sessions_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES public.projects(id) 
  ON DELETE CASCADE;

-- Note: chat_messages already has ON DELETE CASCADE for session_id
