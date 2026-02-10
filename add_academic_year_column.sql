-- It seems your 'courses' table is missing the 'academic_year' column.
-- Run this to fix it:

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS academic_year TEXT;

-- Reload schema cache (function usually not needed if running in dashboard, but good to know)
NOTIFY pgrst, 'reload config';
