import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function CreateExam() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { currentCourse, fetchCourseById } = useCourseStore()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exams, setExams] = useState([])
  
  const [formData, setFormData] = useState({
    exam_name: '',
    max_score: '',
    exam_date: ''
  })
  
  useEffect(() => {
    loadData()
  }, [courseId])
  
  const loadData = async () => {
    await fetchCourseById(courseId)
    await loadExams()
  }
  
  const loadExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
    
    if (data) setExams(data)
  }
  
  const calculateRemainingScore = () => {
    const totalUsed = exams.reduce((sum, exam) => sum + parseFloat(exam.max_score), 0)
    return currentCourse?.exam_total_score - totalUsed
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const remainingScore = calculateRemainingScore()
      const newScore = parseFloat(formData.max_score)
      
      // ตรวจสอบคะแนน
      if (newScore > remainingScore) {
        setError(`คะแนนสอบเกินคะแนนที่เหลือ (เหลือ ${remainingScore} คะแนน)`)
        setLoading(false)
        return
      }
      
      if (newScore <= 0) {
        setError('กรุณากำหนดคะแนนที่มากกว่า 0')
        setLoading(false)
        return
      }
      
      const examData = {
        course_id: courseId,
        exam_name: formData.exam_name,
        max_score: newScore,
        exam_date: formData.exam_date || null
      }
      
      const { data, error: insertError } = await supabase
        .from('exams')
        .insert([examData])
        .select()
      
      if (insertError) throw insertError
      
      // สร้าง exam_scores สำหรับนักเรียนทุกคน
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('student_id')
        .eq('course_id', courseId)
      
      if (enrollments && enrollments.length > 0) {
        const scores = enrollments.map(enrollment => ({
          exam_id: data[0].id,
          student_id: enrollment.student_id,
          score: 0
        }))
        
        await supabase
          .from('exam_scores')
          .insert(scores)
      }
      
      alert('สร้างการสอบสำเร็จ!')
      navigate(`/courses/${courseId}`)
      
    } catch (err) {
      console.error('Error creating exam:', err)
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
  
  const remainingScore = calculateRemainingScore()
  const totalUsed = currentCourse.exam_total_score - remainingScore
  
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">เพิ่มการสอบ</h1>
          
          {/* สรุปคะแนน */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">คะแนนสอบรวม:</span>
              <strong className="text-gray-900">{currentCourse.exam_total_score} คะแนน</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">ใช้ไปแล้ว:</span>
              <strong className="text-orange-600">{totalUsed} คะแนน</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">เหลือ:</span>
              <strong className={remainingScore > 0 ? 'text-green-600' : 'text-red-600'}>
                {remainingScore} คะแนน
              </strong>
            </div>
            <div className="flex justify-between text-sm border-t border-green-200 pt-2 mt-2">
              <span className="text-gray-700">การสอบมีแล้ว:</span>
              <strong className="text-gray-900">{exams.length} ครั้ง</strong>
            </div>
          </div>
          
          {/* รายการสอบที่มีอยู่ */}
          {exams.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">การสอบที่มีอยู่:</h3>
              <div className="space-y-2">
                {exams.map((exam, index) => (
                  <div key={exam.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{index + 1}. {exam.exam_name}</span>
                    <span className="font-medium text-gray-900">{exam.max_score} คะแนน</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {remainingScore <= 0 && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="text-orange-600 flex-shrink-0" size={20} />
                <div className="text-orange-700">
                  <p className="font-semibold mb-1">คะแนนสอบเต็มแล้ว</p>
                  <p className="text-sm">
                    คุณได้ใช้คะแนนสอบครบ {currentCourse.exam_total_score} คะแนนแล้ว
                    ไม่สามารถเพิ่มการสอบได้อีก
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ชื่อการสอบ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อการสอบ *
              </label>
              <input
                type="text"
                name="exam_name"
                value={formData.exam_name}
                onChange={handleChange}
                placeholder="เช่น สอบกลางภาค, สอบปลายภาค, Quiz 1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            
            {/* คะแนนเต็ม */}
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
                max={remainingScore}
                step="0.01"
                placeholder={remainingScore > 0 ? `สูงสุด ${remainingScore} คะแนน` : 'ไม่สามารถเพิ่มได้'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={remainingScore <= 0}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                เหลือคะแนนสอบที่สามารถใช้ได้: <strong>{remainingScore}</strong> คะแนน
              </p>
            </div>
            
            {/* วันที่สอบ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่สอบ
              </label>
              <input
                type="date"
                name="exam_date"
                value={formData.exam_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* คำแนะนำ */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 คำแนะนำ</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• การสอบแต่ละครั้งจะถูกสร้างคะแนน 0 ให้นักเรียนทุกคนอัตโนมัติ</li>
                <li>• คุณสามารถบันทึกคะแนนในหน้า "บันทึกคะแนน" ภายหลัง</li>
                <li>• คะแนนที่กำหนดจะถูกดึงจากคะแนนสอบรวมของรายวิชา</li>
              </ul>
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
                disabled={loading || remainingScore <= 0}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังสร้าง...' : 'สร้างการสอบ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
