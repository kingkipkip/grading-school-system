import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { useAuthStore } from '../../stores/authStore'
import { useAcademicStore } from '../../stores/academicStore'
import { Plus, BookOpen, Users, Calendar } from 'lucide-react'
import { SkeletonCard, SkeletonCourseCard } from '../ui/Skeleton'

export default function Dashboard() {
  const profile = useAuthStore(state => state.profile)
  const { courses, loading: coursesLoading, fetchCourses } = useCourseStore()
  const { academicYears, loading: academicLoading, fetchAcademicYears } = useAcademicStore()

  const [selectedSemester, setSelectedSemester] = useState(null)
  const [upcomingAssignments, setUpcomingAssignments] = useState([])

  useEffect(() => {
    fetchAcademicYears()
  }, [])

  useEffect(() => {
    fetchCourses(selectedSemester)
  }, [selectedSemester])

  // Determine Active Semester
  const activeSemesterInfo = useMemo(() => {
    if (!academicYears.length) return null
    const year = academicYears.find(y => y.semesters?.some(s => s.is_active))
    const semester = year?.semesters?.find(s => s.is_active)

    if (year && semester) {
      return {
        year: year.year_name,
        semester: semester.semester_type === 'summer' ? 'Summer' : semester.semester_type
      }
    }
    return null
  }, [academicYears])

  // Fetch upcoming assignments
  useEffect(() => {
    // Placeholder logic
    setUpcomingAssignments([])
  }, [])

  const isLoading = coursesLoading || academicLoading

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                แดชบอร์ด
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600">
                  ยินดีต้อนรับ {profile?.full_name}
                </p>
                {activeSemesterInfo && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    ปีการศึกษา {activeSemesterInfo.year} ภาคเรียนที่ {activeSemesterInfo.semester}
                  </span>
                )}
              </div>
            </div>

            {['teacher', 'registrar'].includes(profile?.role) && (
              <Link
                to="/courses/create"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
                title={!activeSemesterInfo ? "กรุณาตั้งค่าภาคเรียนปัจจุบันก่อน" : ""}
              >
                <Plus size={20} />
                สร้างรายวิชาใหม่
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {!activeSemesterInfo && ['registrar', 'admin'].includes(profile?.role) && (
          <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg flex items-start justify-between">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 text-orange-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  ยังไม่ได้กำหนดภาคเรียนปัจจุบัน
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  กรุณาไปที่ "ปฏิทินการศึกษา" เพื่อกำหนดปีการศึกษาและภาคเรียนปัจจุบัน เพื่อให้การสร้างรายวิชาทำงานได้อย่างถูกต้อง
                </p>
              </div>
            </div>
            <Link to="/academic-years" className="text-sm font-medium text-orange-600 hover:text-orange-500 underline">
              ไปที่ตั้งค่า
            </Link>
          </div>
        )}

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-4">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <BookOpen className="text-primary-600" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">รายวิชาทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Users className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">รายวิชาที่เปิดอยู่</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => !c.is_closed).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Calendar className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">รายวิชาที่ปิดแล้ว</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.is_closed).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Todolist Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">สิ่งที่ต้องทำ</h2>
            <span className="text-sm text-gray-500">งานที่ครบกำหนดเร็วๆ นี้</span>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingAssignments.length > 0 ? (
                upcomingAssignments.map(assignment => (
                  <div key={assignment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded border border-gray-200">
                        <Calendar size={20} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{assignment.title}</p>
                        <p className="text-xs text-gray-500">
                          {assignment.course?.course_code} • ครบกำหนด {new Date(assignment.due_date).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/courses/${assignment.course_id}/grading`}
                      className="text-sm text-primary-600 font-medium hover:underline"
                    >
                      ตรวจงาน
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="mx-auto mb-2 opacity-50" size={32} />
                  <p>ไม่มีงานที่ต้องส่งเร็วๆ นี้</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">รายวิชาของฉัน</h2>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SkeletonCourseCard />
                <SkeletonCourseCard />
                <SkeletonCourseCard />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">ยังไม่มีรายวิชา</p>
                {['teacher', 'registrar'].includes(profile?.role) && (
                  <Link
                    to="/courses/create"
                    className="inline-block mt-4 text-primary-600 hover:text-primary-700"
                  >
                    สร้างรายวิชาแรกของคุณ
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                {courses.map(course => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="block p-6 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {course.course_code}
                        </h3>
                        <p className="text-sm text-gray-600">{course.course_name}</p>
                      </div>
                      {course.is_closed && (
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          ปิดแล้ว
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>งาน: {course.assignment_total_score} คะแนน</span>
                      <span>สอบ: {course.exam_total_score} คะแนน</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
