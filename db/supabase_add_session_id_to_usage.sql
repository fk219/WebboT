-- Add session_id column to usage_logs
ALTER TABLE public.usage_logs 
ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.chat_sessions(id) ON DELETE SET NULL;

-- Create index for faster aggregation
CREATE INDEX IF NOT EXISTS idx_usage_logs_session_id ON public.usage_logs(session_id);
