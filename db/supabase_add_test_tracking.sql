-- Add is_test column to chat_sessions
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- Add is_test column to usage_logs
ALTER TABLE public.usage_logs 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- Create index for faster filtering of test vs production data
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_test ON public.chat_sessions(is_test);
CREATE INDEX IF NOT EXISTS idx_usage_logs_is_test ON public.usage_logs(is_test);
