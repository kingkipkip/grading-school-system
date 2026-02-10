import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function CreateCourse() {
  const navigate = useNavigate()
  const createCourse = useCourseStore(state => state.createCourse)
  const profile = useAuthStore(state => state.profile)

  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    semester_id: '',
    assignment_total_score: 60,
    exam_total_score: 40
  })

  useEffect(() => {
    fetchSemesters()
  }, [])

  const fetchSemesters = async () => {
    const { data, error } = await supabase
      .from('semesters')
      .select(`
        *,semester_type,
        academic_year:academic_years(*)
      `)
      .eq('is_active', true)
      .order('start_date', { ascending: false })

    if (!error && data) {
      setSemesters(data)
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, semester_id: data[0].id }))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const courseData = {
        course_code: formData.course_code,
        course_name: formData.course_name,
        semester_id: formData.semester_id,
        assignment_total_score: formData.assignment_total_score,
        exam_total_score: formData.exam_total_score,
        teacher_id: profile.id
      }

      const course = await createCourse(courseData)
      navigate(`/courses/${course.id}`)
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างรายวิชา')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('score') ? parseFloat(value) : value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          กลับ
        </button>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">สร้างรายวิชาใหม่</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสวิชา *
                </label>
                <input
                  type="text"
                  name="course_code"
                  value={formData.course_code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ภาคเรียน *
                </label>
                <select
                  name="semester_id"
                  value={formData.semester_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {semesters.map(semester => (
                    <option key={semester.id} value={semester.id}>
                      {semester.academic_year?.year_name} / {semester.semester_type === 'summer' ? 'Summer' : `เทอม ${semester.semester_type}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อวิชา *
              </label>
              <input
                type="text"
                name="course_name"
                value={formData.course_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                การกำหนดคะแนน
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คะแนนงานรวม *
                  </label>
                  <input
                    type="number"
                    name="assignment_total_score"
                    value={formData.assignment_total_score}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คะแนนสอบรวม *
                  </label>
                  <input
                    type="number"
                    name="exam_total_score"
                    value={formData.exam_total_score}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>คะแนนรวม:</strong> {formData.assignment_total_score + formData.exam_total_score} คะแนน
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังสร้าง...' : 'สร้างรายวิชา'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
