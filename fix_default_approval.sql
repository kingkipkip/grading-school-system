-- SAFETY FIX: Set default approval status to FALSE (Pending)
-- This ensures that if no status is provided, the user is NOT approved by default.

ALTER TABLE public.users ALTER COLUMN is_approved SET DEFAULT false;
