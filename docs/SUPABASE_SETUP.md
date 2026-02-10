# คู่มือการตั้งค่า Supabase

## 1. สร้างโปรเจค Supabase

1. ไปที่ [https://supabase.com](https://supabase.com)
2. สร้างบัญชีหรือ Sign in
3. คลิก "New Project"
4. กรอกข้อมูล:
   - Project Name: `grade-management-system` (ตามใจชอบ)
   - Database Password: สร้างรหัสผ่านที่แข็งแรง (เก็บไว้ด้วย)
   - Region: เลือกใกล้ที่สุด (Singapore สำหรับไทย)
5. รอประมาณ 2-3 นาทีให้โปรเจคสร้างเสร็จ

## 2. รัน SQL Schema

1. ไปที่ SQL Editor ในเมนูด้านซ้าย
2. คลิก "+ New Query"
3. คัดลอกเนื้อหาทั้งหมดจากไฟล์ `supabase-schema.sql`
4. วางในหน้า SQL Editor
5. คลิก "Run" (หรือกด Ctrl/Cmd + Enter)
6. ตรวจสอบว่าไม่มี error (ควรเห็นข้อความ "Success. No rows returned")

## 3. ดึง API Keys

1. ไปที่ Settings (ไอคอนเฟือง) → API
2. คัดลอกค่าต่อไปนี้:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public**: `eyJhbGci...` (คีย์ยาวมาก)

## 4. ตั้งค่าในโปรเจค

สร้างไฟล์ `.env` ที่ root ของโปรเจค:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**⚠️ สำคัญ:** ไฟล์ `.env` อยู่ใน `.gitignore` แล้ว จะไม่ถูก commit ขึ้น git

## 5. สร้างผู้ใช้งานทดสอบ

### 5.1 เปิด Authentication

1. ไปที่ Authentication → Settings
2. เปิด Email Authentication
3. ปิด Email Confirmations (สำหรับทดสอบ)

### 5.2 สร้างผู้ใช้ในฐานข้อมูล

รัน SQL นี้ใน SQL Editor:

```sql
-- สร้างครู
INSERT INTO users (id, email, full_name, role)
VALUES 
  ('user-uuid-1', 'teacher@school.com', 'อาจารย์ทดสอบ', 'teacher');

-- สร้างทะเบียน
INSERT INTO users (id, email, full_name, role)
VALUES 
  ('user-uuid-2', 'registrar@school.com', 'เจ้าหน้าที่ทะเบียน', 'registrar');

-- สร้างนักเรียน
INSERT INTO students (student_id, first_name, last_name, grade_level)
VALUES 
  ('S001', 'สมชาย', 'ใจดี', 'ม.3'),
  ('S002', 'สมหญิง', 'รักเรียน', 'ม.3');
```

### 5.3 สร้าง Auth Users

1. ไปที่ Authentication → Users
2. คลิก "Add user" → "Create new user"
3. สร้างผู้ใช้:
   - Email: `teacher@school.com`
   - Password: `password123` (หรือรหัสผ่านที่ต้องการ)
   - Auto Confirm User: ✅ เปิด
4. ทำซ้ำสำหรับ `registrar@school.com`

## 6. สร้างภาคเรียน/ปีการศึกษา

รัน SQL:

```sql
-- สร้างปีการศึกษา
INSERT INTO academic_years (year_name, start_date, end_date, is_active)
VALUES 
  ('2567', '2024-05-16', '2025-03-31', true);

-- สร้างภาคเรียน
INSERT INTO semesters (academic_year_id, semester_type, start_date, end_date, is_active)
SELECT 
  id,
  '1',
  '2024-05-16',
  '2024-09-30',
  true
FROM academic_years WHERE year_name = '2567';

INSERT INTO semesters (academic_year_id, semester_type, start_date, end_date, is_active)
SELECT 
  id,
  '2',
  '2024-11-01',
  '2025-03-31',
  false
FROM academic_years WHERE year_name = '2567';
```

## 7. ทดสอบการเข้าสู่ระบบ

1. รันโปรเจค: `npm run dev`
2. เข้า `http://localhost:3000`
3. ใช้ email และ password ที่สร้างไว้เข้าสู่ระบบ

## 8. Row Level Security (RLS)

Schema ที่สร้างมีการตั้งค่า RLS พื้นฐานแล้ว แต่อาจต้องปรับแต่งเพิ่มเติม:

### ตัวอย่าง Policy เพิ่มเติม:

```sql
-- อนุญาตให้ครูดูข้อมูลรายวิชาของตนเอง
CREATE POLICY "Teachers can view own courses"
ON courses FOR SELECT
USING (teacher_id = auth.uid());

-- อนุญาตให้ครูอัปเดตรายวิชาของตนเอง
CREATE POLICY "Teachers can update own courses"
ON courses FOR UPDATE
USING (teacher_id = auth.uid());

-- อนุญาตให้นักเรียนดูการลงทะเบียนของตนเอง
CREATE POLICY "Students can view own enrollments"
ON course_enrollments FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);
```

## 9. การ Backup

Supabase มี automatic backups แต่สำหรับ free tier:
- Daily backups เก็บ 7 วัน
- สามารถ export database ด้วยตนเองได้

### วิธี Export:

1. ไปที่ Database → Backups
2. คลิก "Download Backup"

## 10. Monitoring

ตรวจสอบการใช้งานที่:
- Reports → Database
- Reports → API
- Reports → Auth

ฟรี tier มีขีดจำกัด:
- 500MB database
- 2GB bandwidth/month
- 50,000 monthly active users

## 11. การอัปเกรด Schema

หากต้องการแก้ไข schema ในภายหลัง:

```sql
-- เพิ่มคอลัมน์
ALTER TABLE courses ADD COLUMN description TEXT;

-- แก้ไข constraint
ALTER TABLE courses 
  ALTER COLUMN assignment_total_score SET DEFAULT 50;

-- สร้าง index เพิ่ม
CREATE INDEX idx_courses_is_closed ON courses(is_closed);
```

## 12. Troubleshooting

### ปัญหาที่พบบ่อย:

**1. "relation does not exist"**
- ตรวจสอบว่ารัน schema.sql ครบถ้วนแล้ว
- ตรวจสอบว่าใช้ schema ที่ถูกต้อง (public schema)

**2. "permission denied"**
- ตรวจสอบ RLS policies
- อาจต้อง disable RLS ชั่วคราวเพื่อทดสอบ

**3. "invalid input syntax for type uuid"**
- ตรวจสอบรูปแบบ UUID
- ใช้ `uuid_generate_v4()` สร้าง UUID ใหม่

**4. Connection timeout**
- ตรวจสอบ internet connection
- ตรวจสอบว่า Supabase project ยัง active

## 13. Best Practices

1. **ใช้ Transactions** สำหรับการเปลี่ยนแปลงหลายตาราง
2. **Index ที่เหมาะสม** สำหรับ query ที่ใช้บ่อย
3. **RLS เสมอ** เพื่อความปลอดภัย
4. **Backup สม่ำเสมอ** ก่อนทำการเปลี่ยนแปลงใหญ่
5. **ตรวจสอบ Logs** เมื่อเกิดปัญหา

## 14. การติดต่อ Support

หากมีปัญหา:
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Documentation](https://supabase.com/docs)
