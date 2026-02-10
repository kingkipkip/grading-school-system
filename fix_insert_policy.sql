-- FIX: Allow users to create their own profile during registration
-- Run this to fix the "permission denied" error

CREATE POLICY "Allow users to insert own profile" ON public.users FOR INSERT WITH CHECK (
    auth.uid() = id
);
