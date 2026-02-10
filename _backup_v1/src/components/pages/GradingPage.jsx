import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Save, FileText, BookOpen } from 'lucide-react'
import { useToast } from '../ui/Toast'
import StatusToggle from '../ui/StatusToggle'
import RegularAssignmentGrid from './RegularAssignmentGrid'
import {
  calculateRegularAssignmentScore,
  calculateSpecialAssignmentScore,
  calculateTotalExamScore,
  calculateGrade
} from '../../utils/gradeCalculations'

export default function GradingPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { currentCourse, fetchCourseById } = useCourseStore()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('assignments') // 'assignments' or 'exams'

  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [exams, setExams] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [examScores, setExamScores] = useState({})

  const [selectedItem, setSelectedItem] = useState(null) // selected assignment or exam

  useEffect(() => {
    loadData()
  }, [courseId])

  const loadData = async () => {
    setLoading(true)
    await fetchCourseById(courseId)
    await loadStudents()
    await loadAssignments()
    await loadExams()
    setLoading(false)
  }

  const loadStudents = async () => {
    const { data } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        student:students(*)
      `)
      .eq('course_id', courseId)
      .order('student(roll_number)', { ascending: true })

    if (data) {
      setStudents(data.map(e => e.student))
    }
  }

  const loadAssignments = async () => {
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (data) {
      setAssignments(data)
      if (data.length > 0 && !selectedItem) {
        // ไม่ต้อง auto select งานแรก เพื่อให้แสดง Grid View เป็นค่าเริ่มต้น
        // setSelectedItem({ type: 'assignment', id: data[0].id })
        // await loadSubmissions(data[0].id)
      }
    }
  }

  const loadExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (data) {
      setExams(data)
    }
  }

  const loadSubmissions = async (assignmentId) => {
    const currentAss = assignments.find(a => a.id === assignmentId);
    if (!currentAss) return;

    // เลือกตารางตามประเภทงานที่ตั้งไว้ใน DB
    const tableName = currentAss.assignment_type === 'special'
      ? 'submission_special'
      : 'submission_regular';

    const { data } = await supabase
      .from(tableName)
      .select('*')
      .eq('assignment_id', assignmentId);

    if (data) {
      const submissionMap = {};
      data.forEach(sub => {
        submissionMap[sub.student_id] = sub;
      });

      // สร้างข้อมูลเริ่มต้นถ้ายังไม่มีใน DB
      students.forEach(student => {
        if (!submissionMap[student.id]) {
          submissionMap[student.id] = currentAss.assignment_type === 'special'
            ? { assignment_id: assignmentId, student_id: student.id, score_raw: 0 }
            : { assignment_id: assignmentId, student_id: student.id, submission_status: 'missing' };
        }
      });
      setSubmissions(submissionMap);
    }
  };

  const loadExamScores = async (examId) => {
    const { data } = await supabase
      .from('exam_scores')
      .select('*')
      .eq('exam_id', examId)

    if (data) {
      const scoreMap = {}
      data.forEach(score => {
        scoreMap[score.student_id] = score
      })

      // เพิ่ม score เริ่มต้นสำหรับนักเรียนที่ยังไม่มี
      students.forEach(student => {
        if (!scoreMap[student.id]) {
          scoreMap[student.id] = {
            exam_id: examId,
            student_id: student.id,
            score: 0
          }
        }
      })

      setExamScores(scoreMap)
    }
  }

  const handleSelectItem = async (type, id) => {
    setSelectedItem({ type, id })

    if (type === 'assignment') {
      setActiveTab('assignments')
      await loadSubmissions(id)
    } else {
      setActiveTab('exams')
      await loadExamScores(id)
    }
  }

  const handleSubmissionChange = (studentId, field, value) => {
    setSubmissions(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }))
  }

  const handleExamScoreChange = (studentId, value) => {
    setExamScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score: value
      }
    }))
  }

  const saveSubmissions = async () => {
    setSaving(true);
    try {
      const currentAss = assignments.find(a => a.id === selectedItem?.id);
      const isSpecial = currentAss.assignment_type === 'special';
      const tableName = isSpecial ? 'submission_special' : 'submission_regular';

      const dataToSave = Object.entries(submissions).map(([studentId, subData]) => {
        const base = {
          assignment_id: currentAss.id,
          student_id: studentId,
        };

        if (subData.id) base.id = subData.id;

        // บันทึก score_raw สำหรับงานพิเศษ หรือ submission_status สำหรับงานทั่วไป
        return isSpecial
          ? { ...base, score_raw: parseFloat(subData.score_raw) || 0 }
          : { ...base, submission_status: subData.submission_status || 'missing' };
      });

      const { error } = await supabase
        .from(tableName)
        .upsert(dataToSave, { onConflict: 'assignment_id, student_id' });

      if (error) throw error;

      await loadSubmissions(currentAss.id);
      toast.success('บันทึกสำเร็จ!');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveExamScores = async () => {
    setSaving(true)
    try {
      const currentExam = exams.find(e => e.id === selectedItem?.id)
      if (!currentExam) {
        toast.error('ไม่พบข้อมูลการสอบ')
        return
      }

      // แยกระหว่าง insert (ไม่มี id) และ update (มี id)
      const updates = []
      const inserts = []

      Object.entries(examScores).forEach(([studentId, scoreData]) => {
        const scoreValue = parseFloat(scoreData.score) || 0

        if (scoreData.id) {
          // มี id แล้ว = update
          updates.push({
            id: scoreData.id,
            score: scoreValue
          })
        } else {
          // ยังไม่มี id = insert
          inserts.push({
            exam_id: currentExam.id,
            student_id: studentId,
            score: scoreValue
          })
        }
      })

      // Insert ก่อน
      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from('exam_scores')
          .insert(inserts)

        if (insertError) throw insertError
      }

      // Update ทีหลัง
      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from('exam_scores')
          .upsert(updates)

        if (updateError) throw updateError
      }

      // Reload ข้อมูล
      await loadExamScores(currentExam.id)

      toast.success('บันทึกคะแนนสำเร็จ!')
    } catch (error) {
      console.error('Error saving exam scores:', error)
      toast.error('เกิดข้อผิดพลาด: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    )
  }

  const currentAssignment = selectedItem?.type === 'assignment'
    ? assignments.find(a => a.id === selectedItem.id)
    : null

  const currentExam = selectedItem?.type === 'exam'
    ? exams.find(e => e.id === selectedItem.id)
    : null

  const regularAssignments = assignments.filter(a => a.assignment_type === 'regular')
  const specialAssignments = assignments.filter(a => a.assignment_type === 'special')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          กลับ
        </button>

        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            บันทึกคะแนน
          </h1>
          <p className="text-gray-600">
            {currentCourse?.course_code} - {currentCourse?.course_name}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - รายการงาน/สอบ */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'assignments'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <FileText size={16} />
                    งาน
                  </button>
                  <button
                    onClick={() => setActiveTab('exams')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'exams'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <BookOpen size={16} />
                    สอบ
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="p-4">
                {activeTab === 'assignments' ? (
                  <div className="space-y-4">
                    {specialAssignments.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          งานพิเศษ
                        </h3>
                        <div className="space-y-1">
                          {specialAssignments.map(assignment => (
                            <button
                              key={assignment.id}
                              onClick={() => handleSelectItem('assignment', assignment.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedItem?.id === assignment.id && selectedItem?.type === 'assignment'
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="flex-1">{assignment.title}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {assignment.max_score}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {regularAssignments.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          งานทั่วไป ({regularAssignments.length})
                        </h3>
                        <div className="space-y-1">
                          {regularAssignments.map((assignment, index) => (
                            <button
                              key={assignment.id}
                              onClick={() => handleSelectItem('assignment', assignment.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedItem?.id === assignment.id && selectedItem?.type === 'assignment'
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                              {regularAssignments.length - index}. {assignment.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {assignments.length === 0 && (
                      <p className="text-center text-gray-500 text-sm py-8">
                        ยังไม่มีงาน
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {exams.map(exam => (
                      <button
                        key={exam.id}
                        onClick={() => handleSelectItem('exam', exam.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedItem?.id === exam.id && selectedItem?.type === 'exam'
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="flex-1">{exam.exam_name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {exam.max_score}
                          </span>
                        </div>
                      </button>
                    ))}

                    {exams.length === 0 && (
                      <p className="text-center text-gray-500 text-sm py-8">
                        ยังไม่มีการสอบ
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - ตารางบันทึกคะแนน */}
          <div className="col-span-12 lg:col-span-9">
            {selectedItem ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {currentAssignment?.title || currentExam?.exam_name}
                      </h2>
                      {currentAssignment && (
                        <p className="text-sm text-gray-600 mt-1">
                          {currentAssignment.assignment_type === 'special'
                            ? `งานพิเศษ - ${currentAssignment.max_score} คะแนน`
                            : 'งานทั่วไป'
                          }
                        </p>
                      )}
                      {currentExam && (
                        <p className="text-sm text-gray-600 mt-1">
                          คะแนนเต็ม: {currentExam.max_score} คะแนน
                        </p>
                      )}
                    </div>

                    <button
                      onClick={selectedItem.type === 'assignment' ? saveSubmissions : saveExamScores}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={18} />
                      {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          รหัสนักเรียน
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          ชื่อ-นามสกุล
                        </th>
                        {selectedItem.type === 'assignment' && currentAssignment?.assignment_type === 'regular' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            สถานะ
                          </th>
                        )}
                        {(selectedItem.type === 'exam' || currentAssignment?.assignment_type === 'special') && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            คะแนน
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student, index) => {
                        const submission = submissions[student.id]
                        const examScore = examScores[student.id]

                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {student.student_id}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {student.first_name} {student.last_name}
                            </td>

                            {/* งานทั่วไป - สถานะ */}
                            {selectedItem.type === 'assignment' && currentAssignment?.assignment_type === 'regular' && (
                              <td className="px-6 py-4">
                                <div className="flex bg-gray-100 rounded-lg p-1 gap-1 w-max">
                                  <StatusToggle
                                    status={submission?.submission_status}
                                    onChange={(newStatus) => handleSubmissionChange(student.id, 'submission_status', newStatus)}
                                  />
                                </div>
                              </td>
                            )}

                            {/* งานพิเศษ - คะแนน */}
                            {selectedItem.type === 'assignment' && currentAssignment?.assignment_type === 'special' && (
                              <td className="px-6 py-4">
                                <input
                                  type="number"
                                  value={submission?.score_raw || ''}
                                  onChange={(e) => handleSubmissionChange(student.id, 'score_raw', e.target.value)}
                                  min="0"
                                  max={currentAssignment.max_score}
                                  step="0.01"
                                  className="w-24 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                                <span className="ml-2 text-xs text-gray-500">
                                  / {currentAssignment.max_score}
                                </span>
                              </td>
                            )}

                            {/* สอบ - คะแนน */}
                            {selectedItem.type === 'exam' && (
                              <td className="px-6 py-4">
                                <input
                                  type="number"
                                  value={examScore?.score || ''}
                                  onChange={(e) => handleExamScoreChange(student.id, e.target.value)}
                                  min="0"
                                  max={currentExam.max_score}
                                  step="0.01"
                                  className="w-24 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                                <span className="ml-2 text-xs text-gray-500">
                                  / {currentExam.max_score}
                                </span>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {students.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      ยังไม่มีนักเรียนในรายวิชานี้
                    </div>
                  )}
                </div>
              </div>
            ) : (
              activeTab === 'assignments' ? (
                <RegularAssignmentGrid
                  courseId={courseId}
                  students={students}
                  assignments={regularAssignments}
                />
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">
                    เลือกการสอบจากด้านซ้ายเพื่อเริ่มบันทึกคะแนน
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
