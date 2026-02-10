-- Add is_approved column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- Update existing users to be approved by default
UPDATE public.users SET is_approved = true WHERE is_approved IS NULL;

-- Policy: Everyone can read is_approved
-- (Already covered by "Read all users" policy: CREATE POLICY "Read all users" ON public.users FOR SELECT USING (true);)

-- Policy updates might be needed if we want to RESTRICT unapproved users from doing things, 
-- but we will handle this primarily in the Frontend/AuthStore for now (User Experience),
-- and RLS policies already rely on Roles. Unapproved Teacher still has 'teacher' role in DB? 
-- Yes, but we will block login.

-- Optional: Create a specific function to approve user if we want strict security, 
-- but allowing Registrars to UPDATE users (which they already can) is sufficient.
