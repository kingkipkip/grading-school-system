import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Save, AlertCircle, FileText, Trash2, Edit3, Award } from 'lucide-react'

export default function GradingGrid({ courseId }) {
    const [students, setStudents] = useState([])
    const [assignments, setAssignments] = useState([])
    const [exams, setExams] = useState([])
    const [submissions, setSubmissions] = useState({}) // mapping: studentId_assignId -> submission
    const [examScores, setExamScores] = useState({}) // mapping: studentId_examId -> score obj
    const [loading, setLoading] = useState(true)

    // Modal State
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState('assignment') // assignment | exam
    const [form, setForm] = useState({ title: '', type: 'regular', max_score: '' })
    const [course, setCourse] = useState(null)

    const [gradeUpdates, setGradeUpdates] = useState({}) // track unsaved changes: key can be studentId_assignId OR studentId_exam_examId

    useEffect(() => {
        fetchData()
    }, [courseId])

    const fetchData = async () => {
        setLoading(true)
        // 0. Fetch Course Details (Total Assignment Score)
        const { data: courseData } = await supabase.from('courses').select('assignment_total_score').eq('id', courseId).single()
        setCourse(courseData)

        // 1. Fetch Students
        const { data: enrollments } = await supabase.from('course_enrollments').select('student:students(*)').eq('course_id', courseId)
        const studentList = enrollments?.map(e => e.student) || []
        setStudents(studentList)

        // 2. Fetch Assignments
        const { data: assignList } = await supabase.from('assignments').select('*').eq('course_id', courseId).order('created_at')
        setAssignments(assignList || [])

        // 3. Fetch Exams
        const { data: examList } = await supabase.from('exams').select('*').eq('course_id', courseId).order('created_at')
        setExams(examList || [])

        // 4. Fetch Submissions
        if (assignList?.length > 0) {
            const { data: subs } = await supabase.from('submissions').select('*').in('assignment_id', assignList.map(a => a.id))
            const subMap = {}
            subs?.forEach(s => { subMap[`${s.student_id}_${s.assignment_id}`] = s })
            setSubmissions(subMap)
        }

        // 5. Fetch Exam Scores
        if (examList?.length > 0) {
            const { data: scores } = await supabase.from('exam_scores').select('*').in('exam_id', examList.map(e => e.id))
            const scoreMap = {}
            scores?.forEach(s => { scoreMap[`${s.student_id}_exam_${s.exam_id}`] = s })
            setExamScores(scoreMap)
        }

        setLoading(false)
    }

    // --- Dynamic Scoring Logic ---
    const calculateRegularMax = (currentAssignments = assignments, currentCourse = course) => {
        if (!currentCourse) return 0
        const totalAssignmentScore = currentCourse.assignment_total_score || 50
        const specialAssignments = currentAssignments.filter(a => a.assignment_type === 'special')
        const totalSpecialScore = specialAssignments.reduce((sum, a) => sum + (a.max_score || 0), 0)

        const regularAssignments = currentAssignments.filter(a => a.assignment_type === 'regular')
        const regularCount = regularAssignments.length

        if (regularCount === 0) return 0
        return (totalAssignmentScore - totalSpecialScore) / regularCount
    }

    const regularMaxScore = calculateRegularMax()

    const recalculateAllRegularScores = async (newAssignments) => {
        // Calculate the NEW max score for regular assignments
        const newMax = calculateRegularMax(newAssignments, course)
        const regularAssigns = newAssignments.filter(a => a.assignment_type === 'regular')
        if (regularAssigns.length === 0) return

        // Fetch all existing submissions for these regular assignments
        const { data: existingSubs } = await supabase
            .from('submissions')
            .select('*')
            .in('assignment_id', regularAssigns.map(a => a.id))

        if (!existingSubs || existingSubs.length === 0) return

        // Prepare updates
        const updates = existingSubs.map(sub => {
            let newScore = 0
            if (sub.submission_status === 'submitted') newScore = newMax
            else if (sub.submission_status === 'late') newScore = newMax * 0.8
            // missing is 0

            return {
                student_id: sub.student_id,
                assignment_id: sub.assignment_id,
                submission_status: sub.submission_status,
                score: newScore
            }
        })

        if (updates.length > 0) {
            await supabase.from('submissions').upsert(updates, { onConflict: 'assignment_id, student_id' })
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()

        if (modalType === 'assignment') {
            const payload = {
                course_id: courseId,
                title: form.title,
                assignment_type: form.type,
                // If regular, stored max_score is irrelevant or can be 0, as we calculate dynamically.
                // But for safety/reporting, we can store 0 or null.
                max_score: form.type === 'special' ? parseFloat(form.max_score || 0) : 0
            }
            const { data, error } = await supabase.from('assignments').insert([payload]).select().single()
            if (data) {
                // Determine new assignment list to recalculate scores
                const newAssignmentsList = [...assignments, data]

                // If we added a Regular OR Special assignment, the weight of Regular ones changes.
                // So we always trigger recalculation for regular ones.
                await recalculateAllRegularScores(newAssignmentsList)

                // Auto-create submissions for the NEW assignment
                const newMax = calculateRegularMax(newAssignmentsList, course)
                const newSubs = students.map(s => ({
                    assignment_id: data.id,
                    student_id: s.id,
                    submission_status: 'missing',
                    score: 0
                }))
                if (newSubs.length > 0) await supabase.from('submissions').insert(newSubs)

            } else if (error) alert(error.message)

        } else {
            // Create Exam
            const payload = {
                course_id: courseId,
                title: form.title,
                max_score: parseFloat(form.max_score || 0)
            }
            const { data, error } = await supabase.from('exams').insert([payload]).select().single()
            if (data) {
                // Auto-create exam scores
                const newScores = students.map(s => ({
                    exam_id: data.id,
                    student_id: s.id,
                    score: 0
                }))
                if (newScores.length > 0) await supabase.from('exam_scores').insert(newScores)
            } else if (error) alert(error.message)
        }

        setShowModal(false)
        setForm({ title: '', type: 'regular', max_score: '' })
        fetchData()
    }

    const handleScoreChange = (key, value) => {
        // For special assignments/exams where we just type numbers
        setGradeUpdates(prev => ({ ...prev, [key]: { score: value, submission_status: 'submitted' } }))
    }

    const handleStatusToggle = (studentId, assignId, currentStatus) => {
        // Use the DYNAMIC max score
        const maxScore = regularMaxScore

        let newStatus = 'submitted'
        let newScore = maxScore

        if (currentStatus === 'missing') {
            newStatus = 'submitted'
            newScore = maxScore
        } else if (currentStatus === 'submitted') {
            newStatus = 'late'
            newScore = maxScore * 0.8
        } else if (currentStatus === 'late') {
            newStatus = 'missing'
            newScore = 0
        }

        const key = `${studentId}_${assignId}`
        setGradeUpdates(prev => ({
            ...prev,
            [key]: {
                score: newScore,
                submission_status: newStatus
            }
        }))
    }

    const saveGrades = async () => {
        const assignmentUpdates = []
        const examUpdates = []

        Object.entries(gradeUpdates).forEach(([key, value]) => {
            if (key.includes('_exam_')) {
                // Exam Update
                const [studentId, _, examId] = key.split('_')
                // value might be simple string/number from previous logic, or object if we unified it.
                // But handleScoreChange now returns object for consistency or we can check type.
                const val = typeof value === 'object' ? value.score : value

                examUpdates.push({
                    student_id: studentId,
                    exam_id: examId,
                    score: parseFloat(val || 0)
                })
            } else {
                // Assignment Update
                const [studentId, assignId] = key.split('_')
                const val = typeof value === 'object' ? value.score : value
                const status = typeof value === 'object' ? value.submission_status : 'submitted'

                assignmentUpdates.push({
                    student_id: studentId,
                    assignment_id: assignId,
                    score: parseFloat(val || 0),
                    submission_status: status
                })
            }
        })

        if (assignmentUpdates.length > 0) {
            await supabase.from('submissions').upsert(assignmentUpdates, { onConflict: 'assignment_id, student_id' })
        }
        if (examUpdates.length > 0) {
            await supabase.from('exam_scores').upsert(examUpdates, { onConflict: 'exam_id, student_id' })
        }

        setGradeUpdates({})
        fetchData()
        alert('บันทึกคะแนนเรียบร้อย')
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="text-blue-600" /> ตารางคะแนน
                </h2>
                <div className="flex gap-2">
                    {Object.keys(gradeUpdates).length > 0 && (
                        <button
                            onClick={saveGrades}
                            className="ios-btn bg-green-600 text-white hover:bg-green-700 animate-pulse"
                        >
                            <Save size={18} /> บันทึก ({Object.keys(gradeUpdates).length})
                        </button>
                    )}
                    <div className="flex rounded-lg overflow-hidden border border-blue-600">
                        <button
                            onClick={() => { setModalType('assignment'); setShowModal(true) }}
                            className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1 border-r border-blue-200"
                        >
                            <Plus size={16} /> งาน
                        </button>
                        <button
                            onClick={() => { setModalType('exam'); setShowModal(true) }}
                            className="px-3 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center gap-1"
                        >
                            <Plus size={16} /> สอบ
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100 pb-4">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 border-b min-w-[200px] left-0 sticky bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                นักเรียน ({students.length})
                            </th>
                            {/* Assignments Header */}
                            {assignments.map(a => (
                                <th key={a.id} className="p-4 border-b min-w-[120px] text-center bg-blue-50/50">
                                    <div className="font-bold text-gray-900">
                                        {a.title}
                                        <div className="text-xs font-normal text-gray-500">
                                            {a.assignment_type === 'special'
                                                ? `Special (${a.max_score})`
                                                : `Regular (${regularMaxScore.toFixed(2)})`}
                                        </div>
                                    </div>
                                </th>
                            ))}
                            {/* Exams Header */}
                            {exams.map(e => (
                                <th key={e.id} className="p-4 border-b min-w-[120px] text-center bg-purple-50/50 border-l border-purple-100">
                                    <div className="font-bold text-purple-900">
                                        {e.title}
                                        <div className="text-xs font-normal text-purple-500">
                                            Exam ({e.max_score})
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 border-r border-gray-100 left-0 sticky bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex flex-col">
                                    <span className="font-medium text-gray-900">{student.first_name} {student.last_name}</span>
                                    <span className="text-xs text-gray-400 font-mono">{student.student_id}</span>
                                </td>

                                {/* Assignment Cells */}
                                {assignments.map(assign => {
                                    const key = `${student.id}_${assign.id}`
                                    const sub = submissions[key]
                                    // Helper to get current value (either from updates or original)
                                    const currentUpdate = gradeUpdates[key]
                                    const currentScore = currentUpdate?.score ?? sub?.score ?? 0
                                    const currentStatus = currentUpdate?.submission_status ?? sub?.submission_status ?? 'missing'
                                    const isMod = gradeUpdates[key] !== undefined

                                    if (assign.assignment_type === 'regular') {
                                        return (
                                            <td key={assign.id} className="p-2 text-center border-r border-gray-50 bg-blue-50/10">
                                                <button
                                                    onClick={() => handleStatusToggle(student.id, assign.id, currentStatus)}
                                                    className={`w-full py-1 px-2 rounded-lg text-xs font-bold transition-all
                                                        ${currentStatus === 'submitted' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                            currentStatus === 'late' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                                                'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                                                        ${isMod ? 'ring-2 ring-blue-400' : ''}
                                                    `}
                                                >
                                                    {currentStatus === 'submitted' ? 'ส่งแล้ว' :
                                                        currentStatus === 'late' ? 'ส่งช้า' : 'ยังไม่ส่ง'}
                                                    <div className="text-[10px] opacity-70">{Number(currentScore).toFixed(2)}</div>
                                                </button>
                                            </td>
                                        )
                                    }

                                    // Special Assignment (Numeric Input)
                                    return (
                                        <td key={assign.id} className="p-2 text-center border-r border-gray-50 relative bg-blue-50/10">
                                            <input
                                                type="number" min="0" step="0.01"
                                                className={`w-16 text-center border rounded-lg py-1 px-2 focus:ring-2 focus:ring-blue-500 outline-none
                                                    ${isMod ? 'bg-yellow-50 border-yellow-400 font-bold' : 'border-gray-200'}
                                                `}
                                                value={currentScore}
                                                onChange={e => handleScoreChange(key, e.target.value)}
                                            />
                                        </td>
                                    )
                                })}

                                {/* Exam Cells */}
                                {exams.map(exam => {
                                    const key = `${student.id}_exam_${exam.id}`
                                    const scoreRecord = examScores[key]
                                    const val = gradeUpdates[key] ?? scoreRecord?.score ?? 0
                                    const isMod = gradeUpdates[key] !== undefined
                                    return (
                                        <td key={exam.id} className="p-2 text-center border-r border-purple-50 relative bg-purple-50/10 border-l border-purple-100">
                                            <input
                                                type="number" min="0" max={exam.max_score}
                                                className={`w-16 text-center border rounded-lg py-1 px-2 focus:ring-2 focus:ring-purple-500 outline-none
                                                    ${isMod ? 'bg-yellow-50 border-yellow-400 font-bold' : 'border-gray-200'}
                                                `}
                                                value={val}
                                                onChange={e => handleScoreChange(key, e.target.value)}
                                            />
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-fade-in shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">
                            {modalType === 'assignment' ? 'เพิ่มงานใหม่' : 'เพิ่มการสอบใหม่'}
                        </h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">ชื่อรายการ</label>
                                <input type="text" required className="ios-input" placeholder={modalType === 'assignment' ? "การบ้าน 1" : "สอบกลางภาค"}
                                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                />
                            </div>

                            {modalType === 'assignment' && (
                                <div>
                                    <label className="text-sm font-medium block mb-1">ประเภท</label>
                                    <select className="ios-input"
                                        value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                    >
                                        <option value="regular">งานทั่วไป (Regular)</option>
                                        <option value="special">งานพิเศษ (Special Project)</option>
                                    </select>
                                </div>
                            )}

                            {(modalType === 'exam' || form.type === 'special') && (
                                <div>
                                    <label className="text-sm font-medium block mb-1">คะแนนเต็ม (Max Score)</label>
                                    <input type="number" required className="ios-input" placeholder="10"
                                        value={form.max_score} onChange={e => setForm({ ...form, max_score: e.target.value })}
                                    />
                                </div>
                            )}

                            {modalType === 'assignment' && form.type === 'regular' && (
                                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg">
                                    💡 คะแนนเต็มจะถูกคำนวณอัตโนมัติจากคะแนนรวมที่เหลือ
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 hover:bg-gray-100 rounded-lg text-sm">ยกเลิก</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
