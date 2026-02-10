import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Upload, UserPlus, Users } from 'lucide-react'
import Papa from 'papaparse'

export default function ImportStudents() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  // Classroom Import State
  // Classroom Import State
  const [classrooms, setClassrooms] = useState([])
  const [selectedClassroomId, setSelectedClassroomId] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchClassrooms()
  }, [])

  const fetchClassrooms = async () => {
    const { data } = await supabase
      .from('classrooms')
      .select('id, name, academic_year')
      .order('name')
    if (data) setClassrooms(data)
  }

  const handleClassroomSelect = async () => {
    if (!selectedClassroomId) return

    setImporting(true)
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('classroom_id', selectedClassroomId)

    setImporting(false)

    if (students && students.length > 0) {
      setPreviewData(students)
    } else {
      setError('ไม่พบนักเรียนในห้องเรียนนี้')
    }
  }

  const importStudents = async () => {
    if (!previewData || previewData.length === 0) return
    setImporting(true)

    try {
      // 1. Fetch existing assignments
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)

      // 2. Fetch existing exams
      const { data: exams } = await supabase
        .from('exams')
        .select('*')
        .eq('course_id', courseId)

      const imported = []
      const errors = []

      for (const student of previewData) {
        try {
          // Enroll
          const { error: enrollError } = await supabase
            .from('course_enrollments')
            .insert({
              course_id: courseId,
              student_id: student.id // We have UUID from students table
            })

          if (enrollError) {
            if (enrollError.code === '23505') {
              // Already enrolled
            } else {
              errors.push(`${student.student_id} - ${enrollError.message}`)
            }
          } else {
            imported.push(student.student_id)

            // Backfill Assignments
            if (assignments && assignments.length > 0) {
              const submissions = assignments.map(a => ({
                assignment_id: a.id,
                student_id: student.id,
                submission_status: 'missing',
                score: 0
              }))

              const { error: subError } = await supabase
                .from('submissions')
                .upsert(submissions, { onConflict: 'assignment_id, student_id' })

              if (subError) {
                console.error('Error backfilling submissions:', subError)
                // Don't fail the whole import, just log error
                errors.push(`${student.student_id} - Submission backfill failed`)
              }
            }

            // Backfill Exams
            if (exams && exams.length > 0) {
              const examScores = exams.map(e => ({
                exam_id: e.id,
                student_id: student.id,
                score: 0
              }))
              await supabase.from('exam_scores').upsert(examScores, { onConflict: 'exam_id, student_id' })
            }
          }

        } catch (err) {
          errors.push(`${student.student_id} - ${err.message}`)
        }
      }

      setSuccess(true)
      // alert(`นำเข้าสำเร็จ ${imported.length} คน${errors.length > 0 ? `\n\nข้อผิดพลาด ${errors.length} รายการ` : ''}`)
      navigate(`/courses/${courseId}`)

    } catch (err) {
      setError('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="group flex items-center gap-1 text-gray-500 hover:text-[#007AFF] mb-6 transition-colors font-medium"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          กลับ
        </button>

        <div className="ios-card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#007AFF]">
              <Users size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">เพิ่มนักเรียนเข้าวิชา</h1>
            <p className="text-gray-500 mt-2">เลือกห้องเรียนที่ต้องการดึงรายชื่อนักเรียน</p>
          </div>

          {!previewData ? (
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">เลือกห้องเรียน</label>
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="ios-input w-full"
                >
                  <option value="">-- กรุณาเลือก --</option>
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (ปีการศึกษา {c.academic_year})</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleClassroomSelect}
                disabled={!selectedClassroomId || importing}
                className="ios-btn w-full bg-[#007AFF] text-white hover:bg-[#0062cc] shadow-lg shadow-blue-200"
              >
                {importing ? 'กำลังค้นหา...' : 'ตรวจสอบรายชื่อ'}
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  รายชื่อที่จะนำเข้า ({previewData.length} คน)
                </h2>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  พร้อมนำเข้า
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto custom-scrollbar border border-gray-200 rounded-xl mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 backdrop-blur sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">รหัส</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">ชื่อ-สกุล</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">ชั้นเรียน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.map((student, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-gray-500">{student.student_id}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{student.first_name} {student.last_name}</td>
                        <td className="px-4 py-3 text-gray-500">{student.grade_level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setPreviewData(null); setSelectedClassroomId(''); setError(''); }}
                  className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                  disabled={importing}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={importStudents}
                  className="flex-[2] py-3 bg-[#007AFF] text-white rounded-xl hover:bg-[#0062cc] shadow-lg shadow-blue-200 font-medium transition-all"
                  disabled={importing}
                >
                  {importing ? 'กำลังบันทึก...' : 'ยืนยันการนำเข้าห้องเรียน'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
