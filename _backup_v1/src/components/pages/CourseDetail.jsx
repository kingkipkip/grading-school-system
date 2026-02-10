import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { ChevronLeft, Users, FileText, ClipboardList, Download, Lock, Plus, BarChart2, UserPlus, GraduationCap } from 'lucide-react'
import AnalyticsComponent from './AnalyticsComponent'
import StudentGradesView from './StudentGradesView'

export default function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { currentCourse, fetchCourseById, closeCourse } = useCourseStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Data States
  const [assignments, setAssignments] = useState([])
  const [exams, setExams] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [examScores, setExamScores] = useState([])
  const [studentSummaries, setStudentSummaries] = useState([])

  // Calculated Totals
  const totalAssignmentScore = assignments.reduce((sum, a) => sum + (a.max_score || 0), 0)
  const totalSpecialScore = assignments.filter(a => a.type === 'special').reduce((sum, a) => sum + (a.max_score || 0), 0)
  const totalRegularScore = assignments.filter(a => a.type === 'regular').reduce((sum, a) => sum + (a.max_score || 0), 0)
  const remainingRegularScore = (currentCourse?.assignment_total_score || 0) - totalSpecialScore

  const totalExamScore = exams.reduce((sum, e) => sum + (e.max_score || 0), 0)
  const remainingExamScore = (currentCourse?.exam_total_score || 0) - totalExamScore

  const regularAssignments = assignments.filter(a => a.type === 'regular')
  const specialAssignments = assignments.filter(a => a.type === 'special')

  const isStudent = profile?.role === 'student'

  // Determine Student ID for the current user
  const currentStudentId = currentCourse?.enrollments?.find(e => e.student?.user_id === profile?.id)?.student?.id

  useEffect(() => {
    if (courseId) {
      fetchData()
    }
  }, [courseId])

  const fetchData = async () => {
    try {
      setLoading(true)
      await fetchCourseById(courseId)

      // 1. Fetch Assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      setAssignments(assignmentsData || [])

      // 2. Fetch Exams
      const { data: examsData } = await supabase
        .from('exams')
        .select('*')
        .eq('course_id', courseId)
        .order('exam_date', { ascending: true })

      setExams(examsData || [])

      // 3. Fetch Submissions & Exam Scores
      const { data: subsData } = await supabase
        .from('submissions')
        .select('*')
        .in('assignment_id', (assignmentsData || []).map(a => a.id))

      setSubmissions(subsData || [])

      const { data: scoresData } = await supabase
        .from('exam_scores')
        .select('*')
        .in('exam_id', (examsData || []).map(e => e.id))

      setExamScores(scoresData || [])

    } catch (error) {
      console.error('Error fetching course details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate Student Summaries (For Teacher View)
  useEffect(() => {
    if (!currentCourse?.enrollments || isStudent) return

    const summaries = currentCourse.enrollments.map(enrollment => {
      const studentId = enrollment.student.id

      // Calculate Assignment Score
      const studentSubmissions = submissions.filter(s => s.student_id === studentId)
      const finalAssignmentScore = studentSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0)

      // Calculate Exam Score
      const studentExamScores = examScores.filter(s => s.student_id === studentId)
      const finalExamScore = studentExamScores.reduce((sum, score) => sum + (score.score || 0), 0)

      return {
        ...enrollment.student,
        student_id: enrollment.student.id,
        final_assignment_score: finalAssignmentScore,
        total_exam_score: finalExamScore,
        grand_total: finalAssignmentScore + finalExamScore
      }
    })

    setStudentSummaries(summaries)
  }, [currentCourse, submissions, examScores, isStudent])

  const handleCloseCourse = async () => {
    if (!confirm('ยืนยันที่จะปิดรายวิชานี้? เมื่อปิดแล้วจะไม่สามารถแก้ไขข้อมูลได้')) return
    await closeCourse(courseId)
    fetchData()
  }

  if (loading) {
    return <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  if (!currentCourse) return <div className="p-8 text-center">ไม่พบรายวิชา</div>

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="group flex items-center gap-1 text-gray-500 hover:text-[#007AFF] mb-6 transition-colors font-medium"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          กลับสู่แดชบอร์ด
        </button>

        {/* Header */}
        <div className="ios-card mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentCourse.course_code}
                </h1>
                <p className="text-lg text-gray-600">{currentCourse.course_name}</p>
              </div>

              {!isStudent && (
                <div className="flex gap-3">
                  {!currentCourse.is_closed ? (
                    <>
                      <button
                        onClick={handleCloseCourse}
                        className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Lock size={18} />
                        ปิดรายวิชา
                      </button>
                      <Link
                        to={`/courses/${courseId}/export`}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Download size={18} />
                        Export ผลการเรียน
                      </Link>
                    </>
                  ) : (
                    <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                      รายวิชาปิดแล้ว
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">คะแนนงาน</p>
                <p className="text-2xl font-bold text-blue-900">
                  {currentCourse.assignment_total_score}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">คะแนนสอบ</p>
                <p className="text-2xl font-bold text-green-900">
                  {currentCourse.exam_total_score}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 mb-1">นักเรียน</p>
                <p className="text-2xl font-bold text-purple-900">
                  {currentCourse.enrollments?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-100 p-2">
            <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl">
              {/* Overview Tab - For Everyone */}
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'overview'
                  ? 'bg-white text-[#007AFF] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
              >
                <FileText size={16} />
                <span>ภาพรวม</span>
              </button>

              {/* Student View Tabs */}
              {isStudent && (
                <button
                  onClick={() => setActiveTab('my-grades')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'my-grades'
                    ? 'bg-white text-[#007AFF] shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                    }`}
                >
                  <GraduationCap size={16} />
                  <span>ผลการเรียนของฉัน</span>
                </button>
              )}

              {/* Teacher/Registrar Tabs */}
              {!isStudent && (
                <>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'students'
                      ? 'bg-white text-[#007AFF] shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                      }`}
                  >
                    <Users size={16} />
                    <span>นักเรียน</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('grades')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'grades'
                      ? 'bg-white text-[#007AFF] shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                      }`}
                  >
                    <ClipboardList size={16} />
                    <span>บันทึกคะแนน</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'analytics'
                      ? 'bg-white text-[#007AFF] shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                      }`}
                  >
                    <BarChart2 size={16} />
                    <span>สถิติ</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}

        {/* 1. Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Assignments Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">งาน</h2>
                {!isStudent && !currentCourse.is_closed && (
                  <Link
                    to={`/courses/${courseId}/assignments/create`}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    <Plus size={16} />
                    เพิ่มงาน
                  </Link>
                )}
              </div>

              <div className="p-6">
                {!isStudent && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>งานพิเศษใช้ไป: <strong>{totalSpecialScore}</strong> คะแนน</span>
                      <span>งานทั่วไปเหลือ: <strong>{remainingRegularScore}</strong> คะแนน</span>
                    </div>
                  </div>
                )}

                {/* Special Assignments */}
                {specialAssignments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">งานพิเศษ</h3>
                    <div className="space-y-2">
                      {specialAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{assignment.title}</p>
                            {assignment.description && (
                              <p className="text-sm text-gray-600">{assignment.description}</p>
                            )}
                          </div>
                          <span className="text-primary-600 font-semibold">
                            {assignment.max_score} คะแนน
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Assignments */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    งานทั่วไป ({regularAssignments.length} ครั้ง)
                  </h3>
                  {regularAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {regularAssignments.map((assignment, index) => (
                        <div
                          key={assignment.id}
                          className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              ครั้งที่ {regularAssignments.length - index}: {assignment.title}
                            </p>
                            {assignment.description && (
                              <p className="text-sm text-gray-600">{assignment.description}</p>
                            )}
                          </div>
                          <span className="text-gray-500 text-sm">
                            {assignment.max_score} คะแนน
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">ยังไม่มีงานทั่วไป</p>
                  )}
                </div>
              </div>
            </div>

            {/* Exams Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">การสอบ</h2>
                {!isStudent && !currentCourse.is_closed && (
                  <Link
                    to={`/courses/${courseId}/exams/create`}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    <Plus size={16} />
                    เพิ่มการสอบ
                  </Link>
                )}
              </div>

              <div className="p-6">
                {!isStudent && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>คะแนนสอบใช้ไป: <strong>{totalExamScore}</strong> คะแนน</span>
                      <span>คะแนนสอบเหลือ: <strong className={remainingExamScore > 0 ? 'text-orange-600' : ''}>{remainingExamScore}</strong> คะแนน</span>
                    </div>
                  </div>
                )}

                {exams.length > 0 ? (
                  <div className="space-y-2">
                    {exams.map(exam => (
                      <div
                        key={exam.id}
                        className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{exam.exam_name}</p>
                          {exam.exam_date && (
                            <p className="text-sm text-gray-600">
                              วันที่สอบ: {new Date(exam.exam_date).toLocaleDateString('th-TH')}
                            </p>
                          )}
                        </div>
                        <span className="text-green-600 font-semibold">
                          {exam.max_score} คะแนน
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">ยังไม่มีการสอบ</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. My Grades Tab (Student Only) */}
        {activeTab === 'my-grades' && isStudent && (
          <StudentGradesView
            assignments={assignments}
            exams={exams}
            submissions={submissions}
            examScores={examScores}
            studentId={currentStudentId}
          />
        )}

        {/* 3. Students Tab (Teacher Only) */}
        {activeTab === 'students' && !isStudent && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">รายชื่อนักเรียน</h2>
              {!currentCourse.is_closed && (
                <Link
                  to={`/courses/${courseId}/students/import`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <UserPlus size={18} />
                    <span>เพิ่มนักเรียนจากห้องเรียน</span>
                  </div>
                </Link>
              )}
            </div>

            {currentCourse.enrollments?.length > 0 ? (
              <div className="overflow-x-auto">
                {/* */}
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลำดับ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รหัสนักเรียน</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ-นามสกุล</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ระดับชั้น</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">คะแนนปัจจุบัน</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">คะแนนรวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentCourse.enrollments.map((enrollment, index) => {
                      const summary = studentSummaries.find(s => s.student_id === enrollment.student.id)

                      return (
                        <tr key={enrollment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{enrollment.student.student_id}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {enrollment.student.first_name} {enrollment.student.last_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{enrollment.student.grade_level}</td>
                          <td className="px-6 py-4 text-sm font-bold text-primary-600">
                            {summary?.grand_total || 0}
                            <span className="text-gray-400 font-normal text-xs ml-1">
                              / {currentCourse.assignment_total_score + currentCourse.exam_total_score}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-12">ยังไม่มีนักเรียนในรายวิชานี้</p>
            )}
          </div>
        )}

        {/* 4. Grades Tab (Teacher Only) */}
        {activeTab === 'grades' && !isStudent && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">สรุปผลการเรียน</h2>
              <Link
                to={`/courses/${courseId}/grading`}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm"
              >
                <ClipboardList size={18} />
                ไปที่หน้าบันทึกคะแนน
              </Link>
            </div>

            {studentSummaries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รหัส</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ-นามสกุล</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        งาน ({currentCourse.assignment_total_score})
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        สอบ ({currentCourse.exam_total_score})
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        รวม (100)
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        เกรด
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {studentSummaries.map((student, index) => {
                      const finalScore = student.grand_total || 0
                      // Simple Grade Calculation (Should ideally be a function shared)
                      let grade = 'F'
                      if (finalScore >= 80) grade = 'A'
                      else if (finalScore >= 75) grade = 'B+'
                      else if (finalScore >= 70) grade = 'B'
                      else if (finalScore >= 65) grade = 'C+'
                      else if (finalScore >= 60) grade = 'C'
                      else if (finalScore >= 55) grade = 'D+'
                      else if (finalScore >= 50) grade = 'D'

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{student.student_code}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-center text-gray-700">
                            {student.final_assignment_score || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-center text-gray-700">
                            {student.total_exam_score || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-center font-bold text-primary-700">
                            {finalScore.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${grade === 'A' || grade === 'B+' || grade === 'B' ? 'bg-green-100 text-green-800' :
                              grade === 'F' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {grade}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-12">ไม่มีข้อมูลคะแนน</p>
            )}
          </div>
        )}

        {/* 5. Analytics Tab (Teacher Only) */}
        {activeTab === 'analytics' && !isStudent && (
          <AnalyticsComponent students={studentSummaries} />
        )}
      </div>
    </div >
  )
}
