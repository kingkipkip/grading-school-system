-- ========================================
-- USER SYNC TRIGGER (AUTH -> PUBLIC)
-- ========================================

-- Function to handle new user signup
-- This function will be called whenever a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    -- Use full_name from metadata, or default to email prefix/placeholder
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    -- Use role from metadata if valid, otherwise default to 'student'
    -- Note: Ensure the metadata 'role' matches the enum values exactly if provided
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on insert
-- Drop first to be safe if applying multiple times (though replace handles function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
