-- Create classrooms table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    academic_year VARCHAR(50), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add classroom_id to students table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'classroom_id') THEN
        ALTER TABLE public.students ADD COLUMN classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL;
        CREATE INDEX idx_students_classroom ON public.students(classroom_id);
    END IF;
END $$;

-- Disable RLS for classrooms
ALTER TABLE public.classrooms DISABLE ROW LEVEL SECURITY;
