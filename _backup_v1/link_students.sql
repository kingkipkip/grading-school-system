-- Update handle_new_user function to link students
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  student_id_input VARCHAR;
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role)
  );

  -- Link to Student if student_id is provided
  student_id_input := new.raw_user_meta_data->>'student_id';
  
  IF student_id_input IS NOT NULL AND student_id_input != '' THEN
    UPDATE public.students
    SET user_id = new.id
    WHERE student_id = student_id_input AND user_id IS NULL;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
