-- =========================================================
-- DANGER: This script will delete ALL DATA in the public schema!
-- usage: Run this in Supabase SQL Editor
-- =========================================================

-- 1. Reset Schema
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 2. Apply Schema (from supabase-schema.sql)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('teacher', 'registrar', 'student');
CREATE TYPE semester_type AS ENUM ('1', '2', 'summer');
CREATE TYPE assignment_type AS ENUM ('regular', 'special');
CREATE TYPE submission_status AS ENUM ('submitted', 'late', 'missing');

-- TABLES
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year_name)
);

CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_type semester_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(academic_year_id, semester_type)
);

CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL, -- e.g. "M.1/1"
    academic_year VARCHAR(50) NOT NULL, -- e.g. "2567"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL, -- Link to Classroom
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assignment_total_score DECIMAL(5,2) NOT NULL DEFAULT 60,
    exam_total_score DECIMAL(5,2) NOT NULL DEFAULT 40,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, student_id)
);

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    assignment_type assignment_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_score DECIMAL(5,2),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    submission_status submission_status NOT NULL DEFAULT 'missing',
    score DECIMAL(5,2),
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    exam_name VARCHAR(255) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    exam_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE exam_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

CREATE TABLE export_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE UNIQUE,
    before_midterm_weight DECIMAL(5,2),
    after_midterm_weight DECIMAL(5,2),
    midterm_exam_id UUID REFERENCES exams(id),
    final_exam_id UUID REFERENCES exams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_courses_semester ON courses(semester_id);
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_exams_course ON exams(course_id);
CREATE INDEX idx_exam_scores_exam ON exam_scores(exam_id);
CREATE INDEX idx_exam_scores_student ON exam_scores(student_id);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view all courses" ON courses
    FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('teacher', 'registrar')));

CREATE POLICY "Teachers can manage their courses" ON courses
    FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their enrollments" ON course_enrollments
    FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can view their submissions" ON assignment_submissions
    FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can view their exam scores" ON exam_scores
    FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON classrooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_scores_updated_at BEFORE UPDATE ON exam_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_export_settings_updated_at BEFORE UPDATE ON export_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. USER SYNC TRIGGER (AUTH -> PUBLIC)
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================
-- 4. GRADE CALCULATION VIEW (v_student_assignment_summary)
-- ========================================
-- Implements: RegularPool = TotalAssignmentScore - Sum(SpecialMax)

DROP VIEW IF EXISTS v_student_assignment_summary;

CREATE VIEW v_student_assignment_summary AS
WITH 
course_stats AS (
    SELECT 
        c.id as course_id,
        c.assignment_total_score,
        COALESCE(SUM(a.max_score) FILTER (WHERE a.assignment_type = 'special'), 0) as total_special_max_score,
        COUNT(a.id) FILTER (WHERE a.assignment_type = 'regular') as total_regular_assignments
    FROM courses c
    LEFT JOIN assignments a ON c.id = a.course_id
    GROUP BY c.id
),
score_factors AS (
    SELECT 
        course_id,
        assignment_total_score,
        total_special_max_score,
        total_regular_assignments,
        (assignment_total_score - total_special_max_score) as regular_score_pool,
        CASE 
            WHEN total_regular_assignments > 0 THEN 
                (assignment_total_score - total_special_max_score) / total_regular_assignments
            ELSE 0 
        END as score_per_regular_assignment
    FROM course_stats
),
student_regular_stats AS (
    SELECT 
        ce.student_id,
        ce.course_id,
        COUNT(sub.id) FILTER (WHERE sub.submission_status = 'submitted') as reg_submitted_count,
        COUNT(sub.id) FILTER (WHERE sub.submission_status = 'late') as reg_late_count,
        COUNT(sub.id) FILTER (WHERE sub.submission_status = 'missing' OR sub.submission_status IS NULL) as reg_missing_count
    FROM course_enrollments ce
    LEFT JOIN assignments a ON ce.course_id = a.course_id AND a.assignment_type = 'regular'
    LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ce.student_id
    GROUP BY ce.student_id, ce.course_id
),
student_special_score AS (
    SELECT 
        ce.student_id,
        ce.course_id,
        COALESCE(SUM(sub.score), 0) as total_special_score_obtained
    FROM course_enrollments ce
    LEFT JOIN assignments a ON ce.course_id = a.course_id AND a.assignment_type = 'special'
    LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ce.student_id
    GROUP BY ce.student_id, ce.course_id
)
SELECT 
    ce.student_id,
    ce.course_id,
    s.student_id as student_code,
    s.first_name,
    s.last_name,
    sf.assignment_total_score,
    sf.total_special_max_score,
    sf.regular_score_pool,
    sf.score_per_regular_assignment,
    CAST(
        (sr.reg_submitted_count * sf.score_per_regular_assignment) +
        (sr.reg_late_count * sf.score_per_regular_assignment * 0.8)
    AS DECIMAL(10,2)) as regular_score_obtained,
    CAST(ss.total_special_score_obtained AS DECIMAL(10,2)) as special_score_obtained,
    CAST(
        ((sr.reg_submitted_count * sf.score_per_regular_assignment) +
         (sr.reg_late_count * sf.score_per_regular_assignment * 0.8)) +
        ss.total_special_score_obtained
    AS DECIMAL(10,2)) as final_assignment_score
FROM course_enrollments ce
JOIN students s ON ce.student_id = s.id
JOIN score_factors sf ON ce.course_id = sf.course_id
LEFT JOIN student_regular_stats sr ON ce.student_id = sr.student_id AND ce.course_id = sr.course_id
LEFT JOIN student_special_score ss ON ce.student_id = ss.student_id AND ce.course_id = ss.course_id;
