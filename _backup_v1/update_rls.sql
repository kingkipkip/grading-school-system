-- 1. Enable RLS on users table (if not already)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Registrars can view all users" ON users;
DROP POLICY IF EXISTS "Registrars can update users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- 3. Create new policies
-- Allow Registrars to view ALL users
CREATE POLICY "Registrars can view all users" ON users
FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'registrar')
);

-- Allow Registrars to update user roles
CREATE POLICY "Registrars can update users" ON users
FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'registrar')
);

-- Allow everyone to view their own profile (Critical for login)
CREATE POLICY "Users can view their own profile" ON users
FOR SELECT USING (
  auth.uid() = id
);

-- 4. YOUR SELF-PROMOTION COMMAND
-- Replace 'YOUR_EMAIL_HERE' with your email address to become the first Admin/Registrar.
UPDATE public.users
SET role = 'registrar'
WHERE email = 'YOUR_EMAIL_HERE';
