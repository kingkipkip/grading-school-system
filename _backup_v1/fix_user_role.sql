-- คำสั่งนี้จะทำการ "ซ่อม" ข้อมูลผู้ใช้ และ "ตั้งค่า Admin" ในคราวเดียวครับ
-- รองรับทั้งกรณีที่ข้อมูลหาย หรือ มีข้อมูลอยู่แล้ว

INSERT INTO public.users (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), 
    'registrar'::public.user_role
FROM auth.users
WHERE email = 'อีเมลของคุณ@example.com'  -- <--- แก้ตรงนี้เป็นอีเมลของคุณ
ON CONFLICT (id) DO UPDATE
SET role = 'registrar'::public.user_role;

-- ตรวจสอบผลลัพธ์ทันที
SELECT * FROM public.users WHERE email = 'อีเมลของคุณ@example.com';  -- <--- แก้ตรงนี้ด้วย
