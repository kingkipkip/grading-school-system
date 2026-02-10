import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Printer } from 'lucide-react'
import PropTypes from 'prop-types'

export default function CourseGrades({ courseId }) {
    const [students, setStudents] = useState([])
    const [assignments, setAssignments] = useState([])
    const [exams, setExams] = useState([])
    const [submissions, setSubmissions] = useState({})
    const [examScores, setExamScores] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId])

    const fetchData = async () => {
        setLoading(true)
        // 1. Fetch Students
        const { data: enrollments } = await supabase.from('course_enrollments').select('student:students(*)').eq('course_id', courseId)
        const studentList = enrollments?.map(e => e.student) || []

        // 2. Fetch Assignments & Exams
        const { data: assignList } = await supabase.from('assignments').select('*').eq('course_id', courseId)
        const { data: examList } = await supabase.from('exams').select('*').eq('course_id', courseId)

        // 3. Fetch Submissions & Exam Scores
        if (assignList?.length > 0) {
            const { data: subs } = await supabase.from('submissions').select('*').in('assignment_id', assignList.map(a => a.id))
            const subMap = {}
            subs?.forEach(s => { subMap[`${s.student_id}_${s.assignment_id}`] = s })
            setSubmissions(subMap)
        }

        if (examList?.length > 0) {
            const { data: scores } = await supabase.from('exam_scores').select('*').in('exam_id', examList.map(e => e.id))
            const scoreMap = {}
            scores?.forEach(s => { scoreMap[`${s.student_id}_exam_${s.exam_id}`] = s })
            setExamScores(scoreMap)
        }

        setStudents(studentList)
        setAssignments(assignList || [])
        setExams(examList || [])
        setLoading(false)
    }

    // --- Calculation Logic ---
    const calculateGrade = (totalScore) => {
        if (totalScore >= 80) return { grade: '4', label: 'A', color: 'text-green-600' }
        if (totalScore >= 75) return { grade: '3.5', label: 'B+', color: 'text-green-500' }
        if (totalScore >= 70) return { grade: '3', label: 'B', color: 'text-blue-600' }
        if (totalScore >= 65) return { grade: '2.5', label: 'C+', color: 'text-blue-500' }
        if (totalScore >= 60) return { grade: '2', label: 'C', color: 'text-yellow-600' }
        if (totalScore >= 55) return { grade: '1.5', label: 'D+', color: 'text-orange-500' }
        if (totalScore >= 50) return { grade: '1', label: 'D', color: 'text-orange-600' }
        return { grade: '0', label: 'F', color: 'text-red-600' }
    }

    const calculateStudentScore = (studentId) => {
        // 1. Assignments
        let total = 0
        assignments.forEach(a => {
            const sub = submissions[`${studentId}_${a.id}`]
            total += (sub?.score || 0)
        })

        // 2. Exams
        exams.forEach(e => {
            const scoreRec = examScores[`${studentId}_exam_${e.id}`]
            total += (scoreRec?.score || 0)
        })

        return total
    }

    if (loading) return <div className="text-center p-8">Loading Grades...</div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Printer className="text-blue-600" /> สรุปผลการเรียน
                </h2>
                <button
                    onClick={() => window.print()}
                    className="ios-btn bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                    <Printer size={18} /> พิมพ์รายงาน
                </button>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">นักเรียน</th>
                            <th className="p-4 font-semibold text-gray-600 text-center">คะแนนรวม</th>
                            <th className="p-4 font-semibold text-gray-600 text-center">เกรด</th>
                            <th className="p-4 font-semibold text-gray-600 text-center">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.map(s => {
                            const totalScore = calculateStudentScore(s.id)
                            const gradeInfo = calculateGrade(totalScore)
                            return (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{s.first_name} {s.last_name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{s.student_id}</div>
                                    </td>
                                    <td className="p-4 text-center font-mono text-lg font-medium">
                                        {totalScore.toFixed(2)}
                                    </td>
                                    <td className={`p-4 text-center font-bold text-xl ${gradeInfo.color}`}>
                                        {gradeInfo.grade}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${gradeInfo.grade === '0' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {gradeInfo.grade === '0' ? 'ไม่ผ่าน' : 'ผ่าน'}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

CourseGrades.propTypes = {
    courseId: PropTypes.string.isRequired
}
