# API Reference & Code Structure

## โครงสร้างโปรเจค

```
grade-management-system/
├── src/
│   ├── components/          # React Components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Layout.jsx
│   │   ├── CreateCourse.jsx
│   │   ├── CourseDetail.jsx
│   │   ├── ImportStudents.jsx
│   │   └── ExportGrades.jsx
│   ├── stores/             # Zustand State Management
│   │   ├── authStore.js
│   │   └── courseStore.js
│   ├── utils/              # Utility Functions
│   │   └── gradeCalculations.js
│   ├── lib/                # Libraries Configuration
│   │   └── supabase.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase-schema.sql     # Database Schema
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## State Management (Zustand)

### authStore

```javascript
import { useAuthStore } from './stores/authStore'

// Available states
const {
  user,           // Current user object
  profile,        // User profile from database
  loading,        // Loading state
  setUser,        // Set user
  setProfile,     // Set profile
  initialize,     // Initialize auth
  signIn,         // Sign in function
  signOut         // Sign out function
} = useAuthStore()

// Usage
const signIn = useAuthStore(state => state.signIn)
await signIn(email, password)
```

### courseStore

```javascript
import { useCourseStore } from './stores/courseStore'

// Available states & actions
const {
  courses,          // All courses
  currentCourse,    // Selected course
  loading,          // Loading state
  fetchCourses,     // Fetch all courses
  fetchCourseById,  // Fetch single course
  createCourse,     // Create new course
  updateCourse,     // Update course
  closeCourse       // Close course
} = useCourseStore()

// Usage
const { fetchCourses } = useCourseStore()
await fetchCourses(semesterId)
```

## Supabase API Calls

### Authentication

```javascript
// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})

// Sign Out
await supabase.auth.signOut()

// Get Session
const { data: { session } } = await supabase.auth.getSession()
```

### Database Queries

#### Courses

```javascript
// Fetch courses
const { data, error } = await supabase
  .from('courses')
  .select(`
    *,
    semester:semesters(*),
    teacher:users!courses_teacher_id_fkey(*)
  `)
  .eq('teacher_id', teacherId)

// Create course
const { data, error } = await supabase
  .from('courses')
  .insert([{
    course_code: 'CS101',
    course_name: 'Introduction to CS',
    semester_id: 'uuid',
    teacher_id: 'uuid',
    assignment_total_score: 60,
    exam_total_score: 40
  }])
  .select()

// Update course
const { data, error } = await supabase
  .from('courses')
  .update({ is_closed: true })
  .eq('id', courseId)

// Delete course
const { data, error } = await supabase
  .from('courses')
  .delete()
  .eq('id', courseId)
```

#### Students

```javascript
// Create student
const { data, error } = await supabase
  .from('students')
  .insert([{
    student_id: 'S001',
    first_name: 'สมชาย',
    last_name: 'ใจดี',
    grade_level: 'ม.3'
  }])
  .select()

// Enroll student
const { data, error } = await supabase
  .from('course_enrollments')
  .insert([{
    course_id: courseId,
    student_id: studentId
  }])
```

#### Assignments

```javascript
// Create assignment
const { data, error } = await supabase
  .from('assignments')
  .insert([{
    course_id: courseId,
    assignment_type: 'regular', // or 'special'
    title: 'Assignment 1',
    description: 'Description here',
    max_score: 10, // only for special assignments
    due_date: '2024-12-31'
  }])
  .select()

// Record submission
const { data, error } = await supabase
  .from('assignment_submissions')
  .upsert([{
    assignment_id: assignmentId,
    student_id: studentId,
    submission_status: 'submitted', // 'submitted', 'late', 'missing'
    score: 8, // for special assignments
    submitted_at: new Date().toISOString()
  }])
```

#### Exams

```javascript
// Create exam
const { data, error } = await supabase
  .from('exams')
  .insert([{
    course_id: courseId,
    exam_name: 'Midterm Exam',
    max_score: 20,
    exam_date: '2024-12-15'
  }])
  .select()

// Record exam score
const { data, error } = await supabase
  .from('exam_scores')
  .upsert([{
    exam_id: examId,
    student_id: studentId,
    score: 18
  }])
```

## Utility Functions

### Grade Calculations

```javascript
import {
  calculateRegularAssignmentScore,
  calculateSpecialAssignmentScore,
  calculateTotalExamScore,
  calculateGrade,
  calculateWeightedScore,
  validateExamScores,
  prepareExportData
} from './utils/gradeCalculations'

// Calculate regular assignment score
const score = calculateRegularAssignmentScore(submissions, totalRegularScore)

// Calculate grade
const { grade, gradePoint } = calculateGrade(80) // returns { grade: 'A', gradePoint: 4.0 }

// Validate exam scores
const { isComplete, used, remaining } = validateExamScores(exams, examTotalScore)
```

### การคำนวณคะแนนงานทั่วไป

```javascript
/**
 * @param {Array} submissions - [{submission_status: 'submitted'|'late'|'missing'}]
 * @param {number} totalRegularScore - คะแนนงานทั่วไปรวม
 * @returns {number} คะแนนที่ได้
 */
function calculateRegularAssignmentScore(submissions, totalRegularScore) {
  const totalAssignments = submissions.length
  const scorePerAssignment = totalRegularScore / totalAssignments
  
  const submitted = submissions.filter(s => s.submission_status === 'submitted').length
  const late = submissions.filter(s => s.submission_status === 'late').length
  
  return (submitted * scorePerAssignment) + (late * scorePerAssignment * 0.8)
}
```

## Component Props & Usage

### Dashboard

```jsx
import Dashboard from './components/Dashboard'

// No props required
<Dashboard />
```

### CreateCourse

```jsx
import CreateCourse from './components/CreateCourse'

// No props required
// Uses useNavigate for redirect after creation
<CreateCourse />
```

### CourseDetail

```jsx
import CourseDetail from './components/CourseDetail'

// Uses URL params
// Route: /courses/:courseId
<Route path="/courses/:courseId" element={<CourseDetail />} />
```

### ImportStudents

```jsx
import ImportStudents from './components/ImportStudents'

// Uses URL params
// Route: /courses/:courseId/students/import
<Route path="/courses/:courseId/students/import" element={<ImportStudents />} />
```

### ExportGrades

```jsx
import ExportGrades from './components/ExportGrades'

// Uses URL params
// Route: /courses/:courseId/export
<Route path="/courses/:courseId/export" element={<ExportGrades />} />
```

## Environment Variables

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## Common Patterns

### Protected Routes

```jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" />
  
  return <Layout>{children}</Layout>
}
```

### Data Fetching

```jsx
useEffect(() => {
  async function loadData() {
    setLoading(true)
    try {
      const data = await fetchSomething()
      setState(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  loadData()
}, [dependency])
```

### Form Handling

```jsx
const [formData, setFormData] = useState({
  field1: '',
  field2: ''
})

const handleChange = (e) => {
  const { name, value } = e.target
  setFormData(prev => ({
    ...prev,
    [name]: value
  }))
}

const handleSubmit = async (e) => {
  e.preventDefault()
  // Process form
}
```

## Error Handling

```javascript
try {
  const { data, error } = await supabase
    .from('table')
    .select()
  
  if (error) throw error
  
  // Process data
} catch (error) {
  console.error('Error:', error)
  setError(error.message)
}
```

## Testing Tips

1. **Test with Different Roles**: ทดสอบด้วย teacher, registrar, student
2. **Edge Cases**: ทดสอบกรณีไม่มีข้อมูล, ข้อมูลผิดพลาด
3. **CSV Import**: ทดสอบไฟล์ CSV ที่มีรูปแบบต่างๆ
4. **Grade Calculation**: ตรวจสอบการคำนวณคะแนนให้ถูกต้อง
5. **RLS Policies**: ตรวจสอบว่า policies ทำงานถูกต้อง

## Performance Optimization

1. **Use Indexes**: สร้าง index สำหรับ query ที่ใช้บ่อย
2. **Lazy Loading**: โหลดข้อมูลเมื่อจำเป็น
3. **Caching**: ใช้ Zustand store เพื่อ cache ข้อมูล
4. **Pagination**: แบ่งหน้าสำหรับข้อมูลจำนวนมาก
5. **Select Specific Columns**: ดึงเฉพาะคอลัมน์ที่ต้องการ

## Security Best Practices

1. **RLS Always On**: เปิด RLS ทุกตาราง
2. **Validate Input**: ตรวจสอบข้อมูลก่อนส่งไป database
3. **Use Prepared Statements**: Supabase จัดการให้แล้ว
4. **Don't Expose Sensitive Data**: ไม่ส่ง password, token ใน response
5. **HTTPS Only**: ใช้ HTTPS เสมอ
