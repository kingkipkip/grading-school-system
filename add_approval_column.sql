
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- Ensure RLS allows updating this column by Registrar
-- The existing policy "Teachers manage users" (if it existed) or "Read all users" doesn't cover UPDATE by Registrar on specific fields?
-- "Update self" exists.

-- We need a policy for Registrar to UPDATE other users' is_approved status.
-- Let's check if we need to add a policy.
-- Schema check showed NO Update policy for Registrar on Users table! Only "Update self".
-- So UserManagement.jsx "Approve" button would FAIL currently.

-- Add Policy for Registrar to Update Users
CREATE POLICY "Registrar update users" ON public.users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'registrar')
);
