-- คำสั่งนี้จะทำการ "ปลดล็อก" สิทธิ์การเข้าถึงทั้งหมดชั่วคราว เพื่อให้แอปทำงานได้ก่อนครับ

-- 1. ให้สิทธิ์การใช้งาน Schema แก่ทุกคน
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. ให้สิทธิ์ Select/Insert/Update/Delete แก่คนที่ล็อกอินแล้ว (Authenticated) กับทุกตาราง
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 3. ปิดระบบ RLS (Security) ของตารางหลักชั่วคราว เพื่อให้มองเห็นข้อมูลแน่นอน
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_regular DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_special DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_scores DISABLE ROW LEVEL SECURITY;

-- 4. เช็คอีกรอบว่า User มีบทบาทอะไร
SELECT email, role FROM public.users WHERE email = 'อีเมลของคุณ@example.com';
