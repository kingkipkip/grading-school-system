import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Download, AlertCircle, CheckCircle } from 'lucide-react'

export default function ImportStudents({ courseId, onSuccess, onClose }) {
    const [classrooms, setClassrooms] = useState([])
    const [selectedClassroom, setSelectedClassroom] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState({ type: '', message: '' })

    useEffect(() => {
        fetchClassrooms()
    }, [])

    const fetchClassrooms = async () => {
        const { data } = await supabase.from('classrooms').select('*').order('name')
        if (data) setClassrooms(data)
    }

    const handleImport = async () => {
        if (!selectedClassroom) return
        setLoading(true)
        setStatus({ type: 'info', message: 'กำลังนำเข้านักเรียน...' })

        try {
            // 1. Get students from classroom
            const { data: students, error: fetchError } = await supabase
                .from('students')
                .select('id, student_id, first_name, last_name')
                .eq('classroom_id', selectedClassroom)

            if (fetchError) throw fetchError
            if (!students || students.length === 0) {
                setStatus({ type: 'error', message: 'ไม่พบนักเรียนในห้องที่เลือก' })
                setLoading(false)
                return
            }

            // 2. Prepare enrollments
            const enrollments = students.map(s => ({
                course_id: courseId,
                student_id: s.id
            }))

            // 3. Upsert enrollments (ignore duplicates)
            const { error: enrollError } = await supabase
                .from('course_enrollments')
                .upsert(enrollments, { onConflict: 'course_id, student_id', ignoreDuplicates: true })

            if (enrollError) throw enrollError

            // 4. BACKFILL SUBMISSIONS (Critical Logic)
            await backfillSubmissions(students, courseId)

            setStatus({ type: 'success', message: `นำเข้านักเรียนสำเร็จ ${students.length} คน` })
            if (onSuccess) onSuccess()

            // Auto close after success
            setTimeout(() => {
                if (onClose) onClose()
            }, 1500)

        } catch (err) {
            console.error(err)
            setStatus({ type: 'error', message: 'เกิดข้อผิดพลาด: ' + err.message })
        } finally {
            setLoading(false)
        }
    }

    const backfillSubmissions = async (students, courseId) => {
        // Find existing assignments
        const { data: assignments } = await supabase.from('assignments').select('id').eq('course_id', courseId)

        // Find existing exams
        const { data: exams } = await supabase.from('exams').select('id').eq('course_id', courseId)

        if (!assignments && !exams) return

        const submissionInserts = []
        const examScoreInserts = []

        students.forEach(student => {
            // Prepare submission rows for every assignment
            assignments?.forEach(assign => {
                submissionInserts.push({
                    assignment_id: assign.id,
                    student_id: student.id,
                    submission_status: 'missing', // Default status
                    score: 0
                })
            })

            // Prepare exam score rows for every exam
            exams?.forEach(exam => {
                examScoreInserts.push({
                    exam_id: exam.id,
                    student_id: student.id,
                    score: 0
                })
            })
        })

        if (submissionInserts.length > 0) {
            await supabase.from('submissions').upsert(submissionInserts, { onConflict: 'assignment_id, student_id', ignoreDuplicates: true })
        }

        if (examScoreInserts.length > 0) {
            await supabase.from('exam_scores').upsert(examScoreInserts, { onConflict: 'exam_id, student_id', ignoreDuplicates: true })
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in max-w-lg w-full mx-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="text-blue-600" /> นำเข้านักเรียนจากห้องเรียน
            </h2>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">เลือกห้องเรียน</label>
                <select
                    className="ios-input"
                    value={selectedClassroom}
                    onChange={e => setSelectedClassroom(e.target.value)}
                    disabled={loading}
                >
                    <option value="">-- เลือกห้องเรียน --</option>
                    {classrooms.map(c => (
                        <option key={c.id} value={c.id}>ห้อง {c.name} (ปี {c.academic_year})</option>
                    ))}
                </select>
            </div>

            {status.message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm mb-4 ${status.type === 'success' ? 'bg-green-50 text-green-700' :
                        status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                    {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {status.message}
                </div>
            )}

            <div className="flex gap-3 justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    disabled={loading}
                >
                    ยกเลิก
                </button>
                <button
                    onClick={handleImport}
                    disabled={!selectedClassroom || loading}
                    className="ios-btn bg-[#007AFF] text-white hover:bg-[#0062cc] disabled:opacity-50"
                >
                    {loading ? 'กำลังนำเข้า...' : 'ยืนยันนำเข้า'}
                </button>
            </div>
        </div>
    )
}
