import { useMemo } from 'react'

export default function StudentGradesView({
    assignments = [],
    exams = [],
    submissions = [],
    examScores = [],
    studentId
}) {

    const gradeData = useMemo(() => {
        // 1. Process Assignments
        const assignmentList = assignments.map(a => {
            const sub = submissions.find(s => s.assignment_id === a.id && s.student_id === studentId)
            return {
                ...a,
                myScore: sub?.score,
                status: sub?.submission_status || 'pending'
            }
        })

        // 2. Process Exams
        const examList = exams.map(e => {
            const score = examScores.find(s => s.exam_id === e.id && s.student_id === studentId)
            return {
                ...e,
                myScore: score?.score
            }
        })

        // 3. Totals
        const totalAssignmentScore = assignmentList.reduce((sum, a) => sum + (a.myScore || 0), 0)
        const totalExamScore = examList.reduce((sum, e) => sum + (e.myScore || 0), 0)
        const grandTotal = totalAssignmentScore + totalExamScore

        // 4. Calculate Grade (Simple Logic)
        let grade = 'F'
        if (grandTotal >= 80) grade = 'A'
        else if (grandTotal >= 75) grade = 'B+'
        else if (grandTotal >= 70) grade = 'B'
        else if (grandTotal >= 65) grade = 'C+'
        else if (grandTotal >= 60) grade = 'C'
        else if (grandTotal >= 55) grade = 'D+'
        else if (grandTotal >= 50) grade = 'D'

        return { assignmentList, examList, totalAssignmentScore, totalExamScore, grandTotal, grade }
    }, [assignments, exams, submissions, examScores, studentId])

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">ผลการเรียนของฉัน</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-500 mb-1">คะแนนเก็บ</p>
                        <p className="text-2xl font-bold text-blue-600">{gradeData.totalAssignmentScore}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-500 mb-1">คะแนนสอบ</p>
                        <p className="text-2xl font-bold text-green-600">{gradeData.totalExamScore}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-500 mb-1">รวมทั้งหมด</p>
                        <p className="text-2xl font-bold text-purple-600">{gradeData.grandTotal}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-500 mb-1">เกรดปัจจุบัน</p>
                        <p className={`text-2xl font-bold ${['A', 'B+', 'B'].includes(gradeData.grade) ? 'text-green-600' :
                            gradeData.grade === 'F' ? 'text-red-600' : 'text-gray-900'
                            }`}>
                            {gradeData.grade}
                        </p>
                    </div>
                </div>
            </div>

            {/* Assignments Detail */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">งานที่ได้รับมอบหมาย</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {gradeData.assignmentList.length > 0 ? (
                        gradeData.assignmentList.map(item => (
                            <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900">{item.title}</p>
                                    <p className="text-sm text-gray-500">เต็ม {item.max_score} คะแนน</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${item.myScore !== undefined ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {item.myScore !== undefined ? item.myScore : '-'}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="p-6 text-center text-gray-500">ยังไม่มีงาน</p>
                    )}
                </div>
            </div>

            {/* Exams Detail */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">การสอบ</h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {gradeData.examList.length > 0 ? (
                        gradeData.examList.map(item => (
                            <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900">{item.exam_name}</p>
                                    <p className="text-sm text-gray-500">เต็ม {item.max_score} คะแนน</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${item.myScore !== undefined ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {item.myScore !== undefined ? item.myScore : '-'}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="p-6 text-center text-gray-500">ยังไม่มีการสอบ</p>
                    )}
                </div>
            </div>
        </div>
    )
}
