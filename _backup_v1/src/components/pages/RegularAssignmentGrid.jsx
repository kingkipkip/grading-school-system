import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Save } from 'lucide-react'
import { useToast } from '../ui/Toast'
import StatusToggle from '../ui/StatusToggle'

export default function RegularAssignmentGrid({ courseId, students, assignments }) {
    const toast = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // State เก็บข้อมูลการส่งงาน
    // Form: { studentId: { assignmentId: 'submitted' | 'late' | 'missing' } }
    const [submissionMatrix, setSubmissionMatrix] = useState({})

    // เก็บสถานะ original เพื่อเช็คว่ามีการแก้ไขหรือไม่
    // const [originalMatrix, setOriginalMatrix] = useState({})

    useEffect(() => {
        if (assignments.length > 0 && students.length > 0) {
            loadAllSubmissions()
        } else {
            setLoading(false)
        }
    }, [assignments, students])

    const loadAllSubmissions = async () => {
        setLoading(true)
        try {
            const assignmentIds = assignments.map(a => a.id)

            const { data } = await supabase
                .from('submissions')
                .select('*')
                .in('assignment_id', assignmentIds)

            // Transform data to Key-Value map for fast lookup
            // { studentId: { assignmentId: status } }
            const matrix = {}

            // Init with empty objects for all students
            students.forEach(s => {
                matrix[s.id] = {}
                assignments.forEach(a => {
                    matrix[s.id][a.id] = 'missing' // Default
                })
            })

            // Fill with actual data
            if (data) {
                data.forEach(sub => {
                    if (matrix[sub.student_id]) {
                        matrix[sub.student_id][sub.assignment_id] = sub.submission_status
                    }
                })
            }

            setSubmissionMatrix(matrix)
        } catch (error) {
            console.error('Error loading submissions:', error)
            toast.error('โหลดข้อมูลไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = (studentId, assignmentId, newStatus) => {
        setSubmissionMatrix(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [assignmentId]: newStatus
            }
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const upserts = []

            // Convert Matrix back to Array for DB
            Object.entries(submissionMatrix).forEach(([studentId, assignmentsMap]) => {
                Object.entries(assignmentsMap).forEach(([assignmentId, status]) => {
                    // เพิ่ม Logic: ถ้าเป็น missing และไม่มี record ใน DB อาจจะไม่ต้อง save?
                    // แต่เพื่อความชัวร์ Save หมด หรือ Save เฉพาะที่เปลี่ยน
                    // สำหรับตอนนี้ Save หมดเพื่อความง่าย (Upsert)
                    upserts.push({
                        assignment_id: assignmentId,
                        student_id: studentId,
                        submission_status: status
                    })
                })
            })

            // Batch Upsert
            // Supabase supports batch insert/upsert
            const { error } = await supabase
                .from('submissions')
                .upsert(upserts, { onConflict: 'assignment_id, student_id' })

            if (error) throw error

            toast.success('บันทึกสำเร็จทั้งหมด!')

            // Reload to ensure sync? Or just keep state.
            // Keeping state is faster.

        } catch (error) {
            console.error('Error saving:', error)
            toast.error('บันทึกไม่สำเร็จ: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="text-center py-8">กำลังโหลดตารางคะแนน...</div>
    }

    if (assignments.length === 0) {
        return <div className="text-center py-8 text-gray-500">ยังไม่มีงานทั่วไปในรายวิชานี้</div>
    }

    return (
        <div className="bg-white rounded-lg shadow flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">ตารางส่งงานทั่วไป</h2>
                    <p className="text-sm text-gray-600">
                        แสดงงานทั้งหมด {assignments.length} ชิ้น ของนักเรียน {students.length} คน
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
            </div>

            {/* Grid Table */}
            <div className="overflow-auto flex-1">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b w-16 bg-gray-100 sticky left-0 z-20">
                                #
                            </th>
                            <th className="p-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b w-48 bg-gray-100 sticky left-16 z-20 min-w-[200px]">
                                ชื่อ-นามสกุล
                            </th>
                            {assignments.map((assignment, index) => (
                                <th
                                    key={assignment.id}
                                    className="p-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-b min-w-[140px]"
                                    title={assignment.title}
                                >
                                    <div className="truncate max-w-[120px] mx-auto">
                                        {assignments.length - index}. {assignment.title}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {students.map((student, index) => (
                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-3 text-sm text-gray-900 border-r bg-gray-50/50 sticky left-0 z-10">
                                    {index + 1}
                                </td>
                                <td className="p-3 text-sm font-medium text-gray-900 border-r bg-gray-50/50 sticky left-16 z-10">
                                    <div className="flex flex-col">
                                        <span>{student.first_name} {student.last_name}</span>
                                        <span className="text-xs text-gray-500">{student.student_id}</span>
                                    </div>
                                </td>
                                {assignments.map(assignment => (
                                    <td key={assignment.id} className="p-3 text-center border-r last:border-r-0">
                                        <div className="flex justify-center">
                                            <StatusToggle
                                                status={submissionMatrix[student.id]?.[assignment.id]}
                                                onChange={(newStatus) => handleStatusChange(student.id, assignment.id, newStatus)}
                                            />
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
