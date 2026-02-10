-- ==========================================
-- SCHEMA V3: COMPLETE RESET & REBUILD
-- ==========================================

-- ⚠️ WARNING: THIS WILL DELETE ALL EXISTING DATA!
-- Run this in Supabase SQL Editor to wipe and reset everything.

-- 1. CLEANUP (Drop existing tables to start fresh)
DROP TABLE IF EXISTS public.exam_scores CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.course_enrollments CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.classrooms CASCADE;
DROP TABLE IF EXISTS public.semesters CASCADE;
DROP TABLE IF EXISTS public.academic_years CASCADE;

-- Drop Enums
DROP TYPE IF EXISTS public.submission_status CASCADE;
DROP TYPE IF EXISTS public.assignment_type CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CREATE TABLES
-- ==========================================

-- 2.1 Academic Years
CREATE TABLE public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_name TEXT NOT NULL, -- e.g. "2567"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Semesters
CREATE TABLE public.semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    semester_type TEXT NOT NULL CHECK (semester_type IN ('1', '2', 'summer')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Classrooms
CREATE TABLE public.classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g. "M.1/1"
    academic_year TEXT NOT NULL, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Users (With is_approved column!)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'registrar')),
    is_approved BOOLEAN DEFAULT true, -- Default true for safety, code sets false for new teachers
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Students
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    grade_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, classroom_id)
);

-- 2.6 Courses (With academic_year column!)
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code TEXT NOT NULL,
    course_name TEXT NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    academic_year TEXT, -- Important for "Create Course"
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

-- 2.7 Assignments & Exams
CREATE TYPE public.assignment_type AS ENUM ('regular', 'special');

CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignment_type public.assignment_type NOT NULL DEFAULT 'regular',
    max_score NUMERIC(5, 2),
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

-- 2.8 Submissions & Scores
CREATE TYPE public.submission_status AS ENUM ('submitted', 'missing', 'late', 'excused');

CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) DEFAULT 0,
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

-- ==========================================
-- 3. ENABLE RLS & POLICIES
-- ==========================================

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

-- Structural Data: Public Read
CREATE POLICY "Public read academic years" ON public.academic_years FOR SELECT USING (true);
CREATE POLICY "Public read semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Public read classrooms" ON public.classrooms FOR SELECT USING (true);

-- Users: Read All, Update Self, Registrar Update All
CREATE POLICY "Read all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Update self" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Registrar update users" ON public.users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'registrar')
);

-- Students: Read All
CREATE POLICY "Read all students" ON public.students FOR SELECT USING (true);

-- Courses Policies
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

-- Submissions & Exam Scores Policies
CREATE POLICY "View submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "View exam scores" ON public.exam_scores FOR SELECT USING (true);

CREATE POLICY "Teachers manage submissions" ON public.submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.assignments a JOIN public.courses c ON a.course_id = c.id WHERE c.teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'registrar'))
);

CREATE POLICY "Teachers manage exam scores" ON public.exam_scores FOR ALL USING (
    EXISTS (SELECT 1 FROM public.exams e JOIN public.courses c ON e.course_id = c.id WHERE c.teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'registrar'))
);

-- ==========================================
-- 4. TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_classrooms_modtime BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_courses_modtime BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
