-- Secure function to claim a student ID
CREATE OR REPLACE FUNCTION claim_student_id(student_id_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner to bypass RLS for the update check
AS $$
DECLARE
    target_student_id UUID;
BEGIN
    -- 1. Check if student_id exists and is NOT taken
    SELECT id INTO target_student_id
    FROM public.students
    WHERE student_id = student_id_input
    AND user_id IS NULL;

    IF target_student_id IS NULL THEN
        -- Either ID doesn't exist OR it's already taken
        RETURN FALSE;
    END IF;

    -- 2. Link the current user to this student
    UPDATE public.students
    SET user_id = auth.uid()
    WHERE id = target_student_id;

    RETURN TRUE;
END;
$$;
