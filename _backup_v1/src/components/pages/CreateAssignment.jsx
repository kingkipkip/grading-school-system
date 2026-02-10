import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function CreateAssignment() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { currentCourse, fetchCourseById } = useCourseStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [assignments, setAssignments] = useState([])

  const [formData, setFormData] = useState({
    assignment_type: 'regular',
    title: '',
    description: '',
    max_score: '',
    due_date: ''
  })

  useEffect(() => {
    loadData()
  }, [courseId])

  const loadData = async () => {
    await fetchCourseById(courseId)
    await loadAssignments()
  }

  const loadAssignments = async () => {
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (data) setAssignments(data)
  }

  const calculateRemainingScores = () => {
    const specialAssignments = assignments.filter(a => a.assignment_type === 'special')
    const totalSpecialScore = specialAssignments.reduce((sum, a) => sum + parseFloat(a.max_score || 0), 0)
    const remainingRegularScore = currentCourse?.assignment_total_score - totalSpecialScore

    return {
      totalSpecialScore,
      remainingRegularScore
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // ตรวจสอบคะแนนงานพิเศษ
      if (formData.assignment_type === 'special') {
        const { remainingRegularScore } = calculateRemainingScores()
        const newScore = parseFloat(formData.max_score)

        if (newScore > remainingRegularScore) {
          setError(`คะแนนงานพิเศษเกินคะแนนที่เหลือ (เหลือ ${remainingRegularScore} คะแนน)`)
          setLoading(false)
          return
        }

        if (!formData.max_score || newScore <= 0) {
          setError('กรุณากำหนดคะแนนงานพิเศษ')
          setLoading(false)
          return
        }
      }

      const assignmentData = {
        course_id: courseId,
        assignment_type: formData.assignment_type,
        title: formData.title,
        description: formData.description || null,
        max_score: formData.assignment_type === 'special' ? parseFloat(formData.max_score) : null,
        due_date: formData.due_date || null
      }

      const { data, error: insertError } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select()

      if (insertError) throw insertError

      // สร้าง submissions สำหรับนักเรียนทุกคน
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('student_id')
        .eq('course_id', courseId)

      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError)
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน: ' + enrollError.message)
      }

      console.log('Found enrollments:', enrollments?.length)

      if (enrollments && enrollments.length > 0) {
        // Unified insertions for both Regular and Special
        const submissions = enrollments.map(enrollment => ({
          assignment_id: data[0].id,
          student_id: enrollment.student_id,
          submission_status: 'missing',
          score: 0
        }))

        const { error: subError } = await supabase
          .from('submissions')
          .insert(submissions)

        if (subError) {
          console.error('Error creating submissions:', subError)
          alert('สร้างงานสำเร็จ แต่ไม่สามารถผูกกับนักเรียนได้: ' + subError.message)
        }
      }

      alert('สร้างงานสำเร็จ!')
      navigate(`/courses/${courseId}`)

    } catch (err) {
      console.error('Error creating assignment:', err)
      setError('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!currentCourse) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    )
  }

  const { totalSpecialScore, remainingRegularScore } = calculateRemainingScores()
  const regularCount = assignments.filter(a => a.assignment_type === 'regular').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          กลับ
        </button>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">เพิ่มงาน</h1>

          {/* สรุปคะแนน */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">คะแนนงานรวม:</span>
              <strong className="text-gray-900">{currentCourse.assignment_total_score} คะแนน</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">งานพิเศษใช้ไป:</span>
              <strong className="text-orange-600">{totalSpecialScore} คะแนน</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">งานทั่วไปเหลือ:</span>
              <strong className="text-green-600">{remainingRegularScore} คะแนน</strong>
            </div>
            <div className="flex justify-between text-sm border-t border-blue-200 pt-2 mt-2">
              <span className="text-gray-700">งานทั่วไปมีแล้ว:</span>
              <strong className="text-gray-900">{regularCount} ครั้ง</strong>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ประเภทงาน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทงาน *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, assignment_type: 'regular', max_score: '' }))}
                  className={`p-4 border-2 rounded-lg transition-all ${formData.assignment_type === 'regular'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">งานทั่วไป</div>
                  <div className="text-sm text-gray-600">
                    คะแนนรวมแบ่งตามจำนวนครั้ง
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, assignment_type: 'special' }))}
                  className={`p-4 border-2 rounded-lg transition-all ${formData.assignment_type === 'special'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">งานพิเศษ</div>
                  <div className="text-sm text-gray-600">
                    กำหนดคะแนนเฉพาะงาน
                  </div>
                </button>
              </div>
            </div>

            {/* ชื่อเรื่อง */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อเรื่อง *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={formData.assignment_type === 'regular' ? 'เช่น งานครั้งที่ 1' : 'เช่น การนำเสนอ'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* คำอธิบาย */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบาย
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="รายละเอียดของงาน (ถ้ามี)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* คะแนนเต็ม (สำหรับงานพิเศษ) */}
            {formData.assignment_type === 'special' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คะแนนเต็ม *
                </label>
                <input
                  type="number"
                  name="max_score"
                  value={formData.max_score}
                  onChange={handleChange}
                  min="0.01"
                  max={remainingRegularScore}
                  step="0.01"
                  placeholder={`สูงสุด ${remainingRegularScore} คะแนน`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  คะแนนนี้จะถูกดึงจากคะแนนงานทั่วไป (เหลือ {remainingRegularScore} คะแนน)
                </p>
              </div>
            )}

            {/* วันกำหนดส่ง */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันกำหนดส่ง
              </label>
              <input
                type="datetime-local"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* ปุ่ม */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/courses/${courseId}`)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || (formData.assignment_type === 'special' && remainingRegularScore <= 0)}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังสร้าง...' : 'สร้างงาน'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
