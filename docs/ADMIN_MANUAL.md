# 🛠️ คู่มือผู้ดูแลระบบและนักพัฒนา

## สารบัญ

1. [การติดตั้งระบบ](#การติดตั้งระบบ)
2. [การตั้งค่า Supabase](#การตั้งค่า-supabase)
3. [การจัดการผู้ใช้](#การจัดการผู้ใช้)
4. [การ Backup และ Restore](#การ-backup-และ-restore)
5. [การ Monitoring](#การ-monitoring)
6. [การ Troubleshooting](#การ-troubleshooting)
7. [API Reference](#api-reference)
8. [การปรับแต่งระบบ](#การปรับแต่งระบบ)

---

## การติดตั้งระบบ

### ความต้องการของระบบ

**Server Requirements:**
- Node.js 18+ 
- npm 9+ หรือ yarn
- 2GB RAM ขึ้นไป
- 10GB disk space

**Browser Requirements:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### ขั้นตอนการติดตั้ง

#### 1. Clone Repository

```bash
git clone https://github.com/your-org/grade-management-system.git
cd grade-management-system
```

#### 2. ติดตั้ง Dependencies

```bash
npm install
```

หรือ

```bash
yarn install
```

#### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env`:

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### 4. รัน Development Server

```bash
npm run dev
```

เปิด browser ที่ `http://localhost:3000`

#### 5. Build สำหรับ Production

```bash
npm run build
```

ไฟล์จะถูกสร้างในโฟลเดอร์ `dist/`

---

## การตั้งค่า Supabase

### 1. สร้าง Project

1. ไปที่ [https://supabase.com](https://supabase.com)
2. Sign in / Sign up
3. Create new project
4. กรอกข้อมูล:
   - **Project name:** grade-management-system
   - **Database password:** (รหัสผ่านแข็งแรง)
   - **Region:** Singapore (ใกล้ไทยที่สุด)
5. รอ 2-3 นาที

### 2. รัน Database Schema

1. ไปที่ **SQL Editor**
2. New query
3. คัดลอกเนื้อหาจาก `supabase-schema.sql`
4. Run
5. ตรวจสอบไม่มี error

### 3. ตั้งค่า Authentication

1. ไปที่ **Authentication** → **Settings**
2. **Email Auth:** Enable
3. **Email Confirmations:** Disable (สำหรับทดสอบ)
4. **Site URL:** https://your-domain.com
5. **Redirect URLs:** 
   - https://your-domain.com/auth/callback
   - http://localhost:3000/auth/callback (dev)

### 4. ตั้งค่า Storage (Optional)

หากต้องการเก็บไฟล์:

1. ไปที่ **Storage**
2. Create bucket: `avatars`
3. Policies:
   - Allow authenticated uploads
   - Allow public read

### 5. ตั้งค่า RLS Policies

RLS ถูกตั้งค่าผ่าน schema แล้ว แต่อาจต้องปรับแต่ง:

```sql
-- ตัวอย่าง: อนุญาตให้ครูดูข้อมูลของตนเอง
CREATE POLICY "Teachers can view own data"
ON courses FOR SELECT
USING (teacher_id = auth.uid());
```

---

## การจัดการผู้ใช้

### สร้างผู้ใช้ใหม่

#### วิธีที่ 1: ผ่าน Supabase Dashboard

1. ไปที่ **Authentication** → **Users**
2. **Add user** → **Create new user**
3. กรอก:
   - Email
   - Password
   - Auto Confirm: ✓
4. Create user
5. ไปที่ **Table Editor** → **users**
6. Insert row:
   ```
   id: (user id จาก auth)
   email: same as above
   full_name: ชื่อ-นามสกุล
   role: teacher / registrar / student
   ```

#### วิธีที่ 2: ผ่าน SQL

```sql
-- 1. สร้าง auth user
INSERT INTO auth.users (email, encrypted_password)
VALUES ('teacher@school.com', crypt('password123', gen_salt('bf')));

-- 2. สร้าง profile
INSERT INTO users (id, email, full_name, role)
SELECT id, email, 'อาจารย์ทดสอบ', 'teacher'
FROM auth.users
WHERE email = 'teacher@school.com';
```

### จัดการ Roles

**Roles ที่มี:**
- `teacher` - ครู (สร้างรายวิชา, บันทึกคะแนน)
- `registrar` - ทะเบียน (จัดการภาคเรียน, ปีการศึกษา)
- `student` - นักเรียน (ดูผลของตนเอง)

**เปลี่ยน Role:**

```sql
UPDATE users
SET role = 'teacher'
WHERE email = 'user@school.com';
```

### รีเซ็ตรหัสผ่าน

```sql
-- Update password ใน auth.users
UPDATE auth.users
SET encrypted_password = crypt('new_password', gen_salt('bf'))
WHERE email = 'user@school.com';
```

หรือใช้ Supabase Dashboard:
1. **Authentication** → **Users**
2. เลือก user
3. **Send password recovery**

### ลบผู้ใช้

```sql
-- ลบจาก users table (จะลบ auth.users ด้วย cascade)
DELETE FROM users WHERE email = 'user@school.com';
```

---

## การ Backup และ Restore

### Automated Backups

Supabase มี automatic backups:
- **Free tier:** Daily backups, เก็บ 7 วัน
- **Pro tier:** Point-in-time recovery (PITR)

### Manual Backup

#### ผ่าน Supabase Dashboard:

1. **Database** → **Backups**
2. **Download Backup**
3. เลือก backup ที่ต้องการ
4. Download (SQL file)

#### ผ่าน Command Line:

```bash
# Export ทั้ง database
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup.dump

# Export เฉพาะ schema
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  --schema-only \
  -f schema.sql

# Export เฉพาะ data
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  -f data.sql
```

### Restore from Backup

```bash
# Restore จาก .dump file
pg_restore -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -c \
  backup.dump

# Restore จาก .sql file
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f backup.sql
```

### Backup ประจำวัน (Recommended)

สร้าง cron job:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups"
DB_HOST="db.your-project.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"

pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_DIR/backup_$DATE.dump"

# เก็บไว้ 30 วัน
find $BACKUP_DIR -name "backup_*.dump" -mtime +30 -delete
```

เพิ่มใน crontab:

```bash
0 2 * * * /path/to/backup.sh
```

---

## การ Monitoring

### 1. Performance Monitoring

#### Supabase Dashboard:

1. **Reports** → **Database**
   - Query performance
   - Slow queries
   - Index usage

2. **Reports** → **API**
   - Request volume
   - Error rates
   - Response times

#### Custom Monitoring:

```javascript
// src/utils/monitoring.js
export function logMetric(name, value, tags = {}) {
  // Send to your monitoring service
  if (window.analytics) {
    window.analytics.track('metric', {
      name,
      value,
      ...tags
    })
  }
}

// Usage
logMetric('page_load_time', loadTime, {
  page: 'dashboard'
})
```

### 2. Error Monitoring

#### ใช้ Sentry:

```bash
npm install @sentry/react
```

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### 3. Log Management

#### Server Logs:

```bash
# ดู logs ใน Supabase
# Database → Logs

# Filter by:
# - Time range
# - Error level
# - Query type
```

#### Application Logs:

```javascript
// src/utils/logger.js
export const logger = {
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data)
    // Send to logging service
  },
  
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error)
    // Send to error tracking
  },
  
  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data)
  }
}
```

### 4. Uptime Monitoring

ใช้บริการ:
- **UptimeRobot** (Free)
- **Pingdom**
- **StatusCake**

ตั้งค่า:
- Check interval: 5 minutes
- Alert channels: Email, SMS, Slack
- Monitors: Main site + API endpoints

---

## การ Troubleshooting

### ปัญหาที่พบบ่อย

#### 1. Database Connection Error

**อาการ:**
```
Error: Failed to connect to database
```

**วิธีแก้:**
1. ตรวจสอบ `.env` ว่า URL ถูกต้อง
2. ตรวจสอบ Supabase project ยัง active
3. ตรวจสอบ network/firewall
4. ลอง restart Supabase project

#### 2. RLS Policy Errors

**อาการ:**
```
Error: new row violates row-level security policy
```

**วิธีแก้:**
1. ตรวจสอบ RLS policies
2. ตรวจสอบ user role ถูกต้อง
3. ชั่วคราว disable RLS เพื่อทดสอบ:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

#### 3. Slow Queries

**อาการ:** หน้าเว็บโหลดช้า

**วิธีแก้:**
1. ดู slow query log
2. เพิ่ม indexes:
   ```sql
   CREATE INDEX idx_courses_teacher ON courses(teacher_id);
   CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);
   ```
3. Optimize queries
4. ใช้ caching

#### 4. Build Errors

**อาการ:**
```
Error: Build failed
```

**วิธีแก้:**
1. ลบ `node_modules` และ install ใหม่:
   ```bash
   rm -rf node_modules
   npm install
   ```
2. ล้าง cache:
   ```bash
   npm run clean
   npm run build
   ```
3. ตรวจสอบ Node.js version
4. ตรวจสอบ dependencies ใน `package.json`

### Debug Mode

เปิด debug mode:

```bash
# Development
VITE_DEBUG=true npm run dev

# ใน code
if (import.meta.env.VITE_DEBUG) {
  console.log('Debug info:', data)
}
```

---

## API Reference

### Supabase Client

```javascript
import { supabase } from './lib/supabase'

// Select
const { data, error } = await supabase
  .from('courses')
  .select('*')
  .eq('teacher_id', userId)

// Insert
const { data, error } = await supabase
  .from('courses')
  .insert([{ course_code: 'CS101', ... }])
  .select()

// Update
const { data, error } = await supabase
  .from('courses')
  .update({ is_closed: true })
  .eq('id', courseId)

// Delete
const { data, error } = await supabase
  .from('courses')
  .delete()
  .eq('id', courseId)
```

### Authentication

```javascript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Get session
const { data: { session } } = await supabase.auth.getSession()
```

### Realtime (Optional)

```javascript
// Subscribe to changes
const subscription = supabase
  .channel('courses')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'courses' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Unsubscribe
subscription.unsubscribe()
```

---

## การปรับแต่งระบบ

### 1. เปลี่ยน Theme Colors

แก้ไข `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... เปลี่ยนสีตามต้องการ
          600: '#0284c7', // สีหลัก
        }
      }
    }
  }
}
```

### 2. เปลี่ยน Logo

1. วางไฟล์ logo ใน `public/`
2. แก้ไข `src/components/Layout.jsx`:
   ```jsx
   <img src="/logo.png" alt="Logo" className="h-8" />
   ```

### 3. เพิ่ม Grade Levels

แก้ไข `src/utils/gradeCalculations.js`:

```javascript
export function calculateGrade(totalScore) {
  if (totalScore >= 90) return { grade: 'A', gradePoint: 4.0 }
  if (totalScore >= 85) return { grade: 'B+', gradePoint: 3.5 }
  // ... เพิ่มเกรดตามต้องการ
}
```

### 4. เปลี่ยนภาษา

แก้ไขข้อความใน components:

```jsx
// Before
<button>Save</button>

// After
<button>บันทึก</button>
```

หรือใช้ i18n library:

```bash
npm install react-i18next
```

### 5. Custom Email Templates

ใน Supabase Dashboard:
1. **Authentication** → **Email Templates**
2. แก้ไข templates:
   - Confirm signup
   - Reset password
   - Magic link

---

## Security Best Practices

### 1. Environment Variables

**NEVER commit `.env` to git:**

```gitignore
.env
.env.local
.env.production
```

**ใช้ secrets management:**
- Vercel: Environment Variables
- Netlify: Environment Variables
- GitHub: Secrets

### 2. RLS Policies

**Always enable RLS:**

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

**Test policies:**

```sql
-- Test as specific user
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claim.sub TO 'user-id';

-- Run query
SELECT * FROM courses;
```

### 3. API Keys

**NEVER expose secret keys:**
- ใช้ `anon` key ใน frontend เท่านั้น
- `service_role` key เก็บใน backend only

### 4. SQL Injection

**Supabase ป้องกัน SQL injection อัตโนมัติ:**

```javascript
// Safe - parameterized
.eq('id', userId)

// DON'T - never use string concatenation
.eq('id', `${userId}`) // ❌
```

### 5. CORS

ตั้งค่าใน Supabase:
1. **Settings** → **API**
2. **CORS Origins:** 
   - https://your-domain.com
   - http://localhost:3000 (dev only)

---

## Scaling Considerations

### Database Optimization

```sql
-- Add indexes for frequent queries
CREATE INDEX idx_courses_semester ON courses(semester_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM courses WHERE semester_id = 'xxx';

-- Vacuum database (ทำเป็นประจำ)
VACUUM ANALYZE;
```

### Caching Strategy

1. **Browser caching:**
   - Static assets: 1 year
   - API responses: 5 minutes

2. **Application caching:**
   - Use `useCachedData` hook
   - Cache duration: 5-10 minutes

3. **CDN caching:**
   - Serve static files from CDN
   - Cache images, CSS, JS

### Performance Monitoring

ติดตั้ง Google Analytics:

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Deployment Checklist

### Pre-deployment:

- [ ] Environment variables ตั้งค่าครบ
- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Build ผ่านไม่มี error
- [ ] Tests ผ่านหมด
- [ ] Performance tested
- [ ] Security audit passed

### Post-deployment:

- [ ] DNS configured
- [ ] SSL certificate active
- [ ] Monitoring setup
- [ ] Backup configured
- [ ] Error tracking active
- [ ] Analytics tracking
- [ ] Documentation updated

---

## Support & Resources

### Documentation:
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Community:
- [Supabase Discord](https://discord.supabase.com)
- [React Community](https://react.dev/community)

### Issues:
- GitHub Issues: (your-repo-url)
- Email: dev@school.com

---

**เอกสารนี้อัพเดท:** มกราคม 2026
**เวอร์ชัน:** 1.0.0
