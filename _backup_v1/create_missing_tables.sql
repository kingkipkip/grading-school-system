-- Create submission_regular table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.submission_regular (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    submission_status public.submission_status NOT NULL DEFAULT 'missing',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- Create submission_special table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.submission_special (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    score_raw DECIMAL(5,2) DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- Disable RLS for these new tables to ensure checking/grading works immediately
ALTER TABLE public.submission_regular DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_special DISABLE ROW LEVEL SECURITY;
