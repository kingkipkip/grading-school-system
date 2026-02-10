import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { ArrowLeft, Users, FileText, GraduationCap, Plus, Download, Settings } from 'lucide-react'
import ImportStudents from './ImportStudents'
import GradingGrid from './GradingGrid'
import ExportSGSModal from './ExportSGSModal'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('students') // students, assignments, grades
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [students, setStudents] = useState([])

  useEffect(() => {
    fetchCourseData()
  }, [id])

  // ... (existing code: fetchCourseData, Edit Modal State, handlers) ...

  const fetchCourseData = async () => {
    setLoading(true)
    // 1. Fetch Course Info
    const { data: courseData } = await supabase.from('courses').select('*').eq('id', id).single()
    setCourse(courseData)

    // 2. Fetch Enrolled Students
    const { data: enrollmentData } = await supabase
      .from('course_enrollments')
      .select('student:students(*)')
      .eq('course_id', id)

    const flatStudents = enrollmentData?.map(e => e.student) || []
    setStudents(flatStudents)

    setLoading(false)
  }

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    course_code: '',
    course_name: '',
    description: '',
    academic_year: ''
  })

  const openEditModal = () => {
    setEditForm({
      course_code: course.course_code,
      course_name: course.course_name,
      description: course.description || '',
      academic_year: course.academic_year || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateCourse = async (e) => {
    e.preventDefault()
    const { error } = await supabase
      .from('courses')
      .update(editForm)
      .eq('id', id)

    if (error) {
      alert('Error updating course: ' + error.message)
    } else {
      await fetchCourseData()
      setShowEditModal(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading Course...</div>
  if (!course) return <div className="p-8 text-center">Course not found</div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 mb-4 hover:text-gray-900">
          <ArrowLeft size={20} /> กลับสู่แดชบอร์ด
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{course.course_code}</span>
              <span className="text-gray-500 text-sm">ปีการศึกษา {course.academic_year || 'N/A'}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{course.course_name}</h1>
            <p className="text-gray-500 text-sm mt-1">{students.length} นักเรียนลงทะเบียน</p>
          </div>

          {/* Teacher Actions */}
          {profile?.role === 'teacher' && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowExportModal(true)}
                className="ios-btn bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
              >
                <Download size={18} /> Export SGS
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="ios-btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Download size={18} /> นำเข้านักเรียน
              </button>
              <button
                onClick={openEditModal}
                className="ios-btn bg-[#007AFF] text-white hover:bg-[#0062cc]"
              >
                <Settings size={18} /> ตั้งค่ารายวิชา
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'students' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} /> รายชื่อนักเรียน ({students.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'assignments' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <div className="flex items-center gap-2">
            <FileText size={16} /> งานและการสอบ
          </div>
        </button>
        <button
          onClick={() => setActiveTab('grades')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'grades' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <div className="flex items-center gap-2">
            <GraduationCap size={16} /> ตัดเกรด
          </div>
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px] p-6">
        {activeTab === 'students' && (
          <div className="space-y-4">
            {students.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>ยังไม่มีนักเรียนในรายวิชานี้</p>
                {profile?.role === 'teacher' && (
                  <button onClick={() => setShowImportModal(true)} className="text-blue-600 hover:underline mt-2">
                    + นำเข้านักเรียน
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 font-semibold text-gray-600 text-sm">รหัสนักเรียน</th>
                    <th className="p-3 font-semibold text-gray-600 text-sm">ชื่อ-นามสกุล</th>
                    <th className="p-3 font-semibold text-gray-600 text-sm">ระดับชั้น</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">{s.student_id}</td>
                      <td className="p-3">{s.first_name} {s.last_name}</td>
                      <td className="p-3 text-sm text-gray-500">{s.grade_level || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <GradingGrid courseId={id} />
        )}

        {activeTab === 'grades' && (
          <CourseGrades courseId={id} />
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <ImportStudents
            courseId={id}
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              fetchCourseData()
              // No need to close explicitly, component handles it with timeout
            }}
          />
        </div>
      )}

      {/* SGS Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <ExportSGSModal
            courseId={id}
            onClose={() => setShowExportModal(false)}
          />
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-fade-in shadow-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Settings size={20} className="text-blue-600" /> ตั้งค่ารายวิชา
            </h3>
            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">รหัสวิชา</label>
                <input type="text" required className="ios-input"
                  value={editForm.course_code} onChange={e => setEditForm({ ...editForm, course_code: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">ชื่อวิชา</label>
                <input type="text" required className="ios-input"
                  value={editForm.course_name} onChange={e => setEditForm({ ...editForm, course_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">ปีการศึกษา</label>
                <input type="text" required className="ios-input" placeholder="เช่น 2567"
                  value={editForm.academic_year} onChange={e => setEditForm({ ...editForm, academic_year: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">ระบุปีการศึกษา (จะแสดงผลแทน N/A)</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">คำอธิบาย</label>
                <textarea className="ios-input" rows="3"
                  value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 hover:bg-gray-100 rounded-lg text-sm">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">บันทึกการแก้ไข</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
