import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Download, FileSpreadsheet, X } from 'lucide-react'

export default function ExportSGSModal({ courseId, onClose }) {
    const [loading, setLoading] = useState(true)
    const [exams, setExams] = useState([])
    const [course, setCourse] = useState(null)

    // Form State
    const [config, setConfig] = useState({
        preMidWeight: 20,
        postMidWeight: 30,
        midtermExamId: '',
        finalExamId: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        // 1. Fetch Course (for assignment max score)
        const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).single()
        setCourse(courseData)

        // 2. Fetch Exams (for dropdowns)
        const { data: examData } = await supabase.from('exams').select('*').eq('course_id', courseId).order('created_at')
        setExams(examData || [])

        setLoading(false)
    }

    const handleExport = async () => {
        setLoading(true)
        try {
            // 1. Fetch All Necessary Data
            const { data: students } = await supabase.from('course_enrollments').select('student:students(*)').eq('course_id', courseId)
            const { data: assignments } = await supabase.from('assignments').select('*').eq('course_id', courseId)
            const { data: submissions } = await supabase.from('submissions').select('*').in('assignment_id', assignments.map(a => a.id))
            const { data: examScores } = await supabase.from('exam_scores').select('*').in('exam_id', exams.map(e => e.id))

            // 2. Helper Maps
            const subMap = {} // studentId_assignId -> score
            submissions?.forEach(s => subMap[`${s.student_id}_${s.assignment_id}`] = s.score)

            const scoreMap = {} // studentId_examId -> score
            examScores?.forEach(s => scoreMap[`${s.student_id}_${s.exam_id}`] = s.score)

            // 3. Construct CSV Data
            const headers = ['Student ID', 'Name', 'Pre-Midterm', 'Midterm Exam', 'Post-Midterm', 'Final Exam', 'Total']
            const rows = []

            const flatStudents = students?.map(e => e.student) || []
            const maxAssignScore = course.assignment_total_score || 100 // Avoid divide by zero

            flatStudents.forEach(student => {
                // A. Calculate Total Assignment Score for Student
                let studentAssignTotal = 0
                assignments.forEach(a => {
                    studentAssignTotal += (subMap[`${student.id}_${a.id}`] || 0)
                })

                // B. Calculate Ratio & Weights
                const ratio = studentAssignTotal / maxAssignScore
                // Clamp ratio to 1? Usually yes, but implies bonus points. Let's keep raw.
                // If student gets 55/50 (bonus), ratio > 1. 

                const preMidScore = (ratio * config.preMidWeight).toFixed(2)
                const postMidScore = (ratio * config.postMidWeight).toFixed(2)

                // C. Get Exam Scores
                const midExamScore = config.midtermExamId ? (scoreMap[`${student.id}_${config.midtermExamId}`] || 0) : 0
                const finalExamScore = config.finalExamId ? (scoreMap[`${student.id}_${config.finalExamId}`] || 0) : 0

                const total = (parseFloat(preMidScore) + parseFloat(postMidScore) + parseFloat(midExamScore) + parseFloat(finalExamScore)).toFixed(2)

                rows.push([
                    student.student_id,
                    `${student.first_name} ${student.last_name}`,
                    preMidScore,
                    midExamScore,
                    postMidScore,
                    finalExamScore,
                    total
                ])
            })

            // 4. Generate CSV String (with BOM for Excel)
            const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

            // 5. Download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `SGS_Export_${course.course_code}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            onClose()

        } catch (error) {
            alert('Export Failed: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fade-in shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileSpreadsheet className="text-green-600" /> Export to SGS
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-6">
                {/* 1. Assignment Weights */}
                <div className="bg-blue-50 p-4 rounded-xl space-y-3">
                    <h4 className="font-semibold text-blue-800 text-sm">1. แบ่งคะแนนเก็บ (Assignments)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-blue-700 block mb-1">ก่อนกลางภาค (Pre)</label>
                            <input
                                type="number"
                                className="ios-input text-center"
                                value={config.preMidWeight}
                                onChange={e => setConfig({ ...config, preMidWeight: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-blue-700 block mb-1">หลังกลางภาค (Post)</label>
                            <input
                                type="number"
                                className="ios-input text-center"
                                value={config.postMidWeight}
                                onChange={e => setConfig({ ...config, postMidWeight: e.target.value })}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-blue-600">
                        * คะแนนเก็บรวมของนักเรียน จะถูกแบ่งตามน้ำหนักที่กำนด
                    </p>
                </div>

                {/* 2. Exam Mapping */}
                <div className="bg-purple-50 p-4 rounded-xl space-y-3">
                    <h4 className="font-semibold text-purple-800 text-sm">2. เทียบคะแนนสอบ (Exams)</h4>

                    <div>
                        <label className="text-xs font-medium text-purple-700 block mb-1">สอบกลางภาค (Midterm)</label>
                        <select
                            className="ios-input"
                            value={config.midtermExamId}
                            onChange={e => setConfig({ ...config, midtermExamId: e.target.value })}
                        >
                            <option value="">-- ไม่ระบุ --</option>
                            {exams.map(e => <option key={e.id} value={e.id}>{e.title} ({e.max_score})</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-purple-700 block mb-1">สอบปลายภาค (Final)</label>
                        <select
                            className="ios-input"
                            value={config.finalExamId}
                            onChange={e => setConfig({ ...config, finalExamId: e.target.value })}
                        >
                            <option value="">-- ไม่ระบุ --</option>
                            {exams.map(e => <option key={e.id} value={e.id}>{e.title} ({e.max_score})</option>)}
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    disabled={loading}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                >
                    {loading ? 'Generating...' : <><Download size={20} /> Export Excel (CSV)</>}
                </button>
            </div>
        </div>
    )
}
