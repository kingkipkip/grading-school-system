-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Academic Years & Semesters (Foundation)
CREATE TABLE public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_name TEXT NOT NULL, -- e.g. "2567"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    semester_type TEXT NOT NULL CHECK (semester_type IN ('1', '2', 'summer')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Classrooms (Linked to Academic Year via Semester or directly if needed, usually linked to specific year)
-- Ideally classrooms are for a specific academic year/semester. 
-- For simplicity in this system, let's link to academic_year (or just string is fine if user prefers, but relational is better)
CREATE TABLE public.classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g. "M.1/1"
    academic_year TEXT NOT NULL, -- Keep simplified string for now or link to table. Let's keep string to match old system for easier migration, OR upgrade. 
    -- UPGRADE: Link to academic_years table? No, user entered "2567" manually before. Let's keep it flexible but maybe add a column later.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users & Students
-- Users are handled by Supabase Auth (auth.users). We need a public profile table.
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'registrar')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL, -- School ID e.g. "12345"
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Linked when student registers
    grade_level TEXT, -- e.g. "M.1"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, classroom_id) -- Prevent duplicate student in same class
);

-- 4. Courses & Enrollments
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL, -- Optional link to semester
    academic_year TEXT, -- Fallback if semester_id is not used
    assignment_total_score NUMERIC(5, 2) DEFAULT 0,
    exam_total_score NUMERIC(5, 2) DEFAULT 0,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, student_id)
);

-- 5. Assignments & Exams
CREATE TYPE public.assignment_type AS ENUM ('regular', 'special');

CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignment_type public.assignment_type NOT NULL DEFAULT 'regular',
    max_score NUMERIC(5, 2), -- NULL for regular (calculated later) or Fixed for special
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    exam_name TEXT NOT NULL,
    description TEXT,
    max_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    exam_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Submissions (UNIFIED)
CREATE TYPE public.submission_status AS ENUM ('submitted', 'missing', 'late', 'excused');

CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) DEFAULT 0, -- Actual score given
    submission_status public.submission_status DEFAULT 'missing',
    submitted_at TIMESTAMPTZ,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

CREATE TABLE public.exam_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

-- 7. RLS Policies (Simplified for Dev, but secure enough)
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_scores ENABLE ROW LEVEL SECURITY;

-- Public read for structural tables
CREATE POLICY "Public read academic years" ON public.academic_years FOR SELECT USING (true);
CREATE POLICY "Public read semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Public read classrooms" ON public.classrooms FOR SELECT USING (true);

-- Users: Read all, Update self
CREATE POLICY "Read all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Update self" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Students: Read all (Teachers/Registrars need to see all)
CREATE POLICY "Read all students" ON public.students FOR SELECT USING (true);

-- Courses: 
-- Teachers see their own courses.
-- Students see courses they are enrolled in.
-- Registrars see all.
CREATE POLICY "Teachers view own courses" ON public.courses FOR SELECT USING (
    (auth.uid() = teacher_id) OR 
    (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'registrar')) OR
    (EXISTS (SELECT 1 FROM public.course_enrollments ce JOIN public.students s ON ce.student_id = s.id WHERE s.user_id = auth.uid() AND ce.course_id = public.courses.id))
);

CREATE POLICY "Teachers create courses" ON public.courses FOR INSERT WITH CHECK (
    auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'registrar')
);

CREATE POLICY "Teachers update own courses" ON public.courses FOR UPDATE USING (
    auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'registrar')
);

-- Submissions/Scores:
-- Teachers view/edit all in their course.
-- Students view their own.
CREATE POLICY "View submissions" ON public.submissions FOR SELECT USING (true); -- Simplify for now, filter in app
CREATE POLICY "View exam scores" ON public.exam_scores FOR SELECT USING (true);

-- Permissions for Insert/Update submissions
CREATE POLICY "Teachers manage submissions" ON public.submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.assignments a JOIN public.courses c ON a.course_id = c.id WHERE c.teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'registrar'))
);

CREATE POLICY "Teachers manage exam scores" ON public.exam_scores FOR ALL USING (
    EXISTS (SELECT 1 FROM public.exams e JOIN public.courses c ON e.course_id = c.id WHERE c.teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'registrar'))
);

-- Triggers update_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_classrooms_modtime BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_students_modtime BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_courses_modtime BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_submissions_modtime BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
