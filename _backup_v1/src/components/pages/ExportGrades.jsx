import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Download, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { prepareExportData, validateExamScores } from '../../utils/gradeCalculations'

export default function ExportGrades() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { currentCourse, fetchCourseById } = useCourseStore()
  
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const [exportSettings, setExportSettings] = useState({
    before_midterm_weight: 20,
    after_midterm_weight: 30,
    midterm_exam_id: '',
    final_exam_id: ''
  })
  const [errors, setErrors] = useState([])
  
  useEffect(() => {
    loadData()
  }, [courseId])
  
  const loadData = async () => {
    setLoading(true)
    await fetchCourseById(courseId)
    await loadExams()
    await loadExportSettings()
    setLoading(false)
  }
  
  const loadExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })
    
    if (data) {
      setExams(data)
      if (data.length >= 2) {
        setExportSettings(prev => ({
          ...prev,
          midterm_exam_id: data[0].id,
          final_exam_id: data[1].id
        }))
      }
    }
  }
  
  const loadExportSettings = async () => {
    const { data } = await supabase
      .from('export_settings')
      .select('*')
      .eq('course_id', courseId)
      .single()
    
    if (data) {
      setExportSettings(prev => ({
        ...prev,
        ...data
      }))
    }
  }
  
  const validateSettings = () => {
    const newErrors = []
    
    // ตรวจสอบน้ำหนักคะแนน
    const totalWeight = exportSettings.before_midterm_weight + exportSettings.after_midterm_weight
    if (totalWeight !== currentCourse.assignment_total_score) {
      newErrors.push(
        `น้ำหนักคะแนนไม่ตรงกับคะแนนงานรวม (${totalWeight} ≠ ${currentCourse.assignment_total_score})`
      )
    }
    
    // ตรวจสอบการสอบ
    if (!exportSettings.midterm_exam_id) {
      newErrors.push('กรุณาเลือกการสอบกลางภาค')
    }
    if (!exportSettings.final_exam_id) {
      newErrors.push('กรุณาเลือกการสอบปลายภาค')
    }
    
    // ตรวจสอบคะแนนสอบ
    const examValidation = validateExamScores(exams, currentCourse.exam_total_score)
    if (!examValidation.isComplete && exams.length > 0) {
      const shouldContinue = window.confirm(
        `คะแนนสอบยังใช้ไม่หมด (เหลืออีก ${examValidation.remaining} คะแนน)\n` +
        `ต้องการดำเนินการต่อหรือไม่?`
      )
      if (!shouldContinue) {
        newErrors.push('ยกเลิกการ export')
      }
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }
  
  const handleExport = async () => {
    if (!validateSettings()) return
    setLoading(true)
    
    try {
      // 1. ดึงคะแนนงานรวมจาก View (VIP/Regular)
      const { data: summaryData } = await supabase
        .from('v_student_assignment_summary')
        .select('*')
        .eq('course_id', courseId);

      // 2. ดึงคะแนนสอบ
      const { data: examScores } = await supabase
        .from('exam_scores')
        .select('student_id, exam_id, score')
        .in('exam_id', [exportSettings.midterm_exam_id, exportSettings.final_exam_id]);

      // 3. ดึงรายชื่อนักเรียน เรียงตามรหัส (student_id) เท่านั้น
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select(`*, student:students(*)`)
        .eq('course_id', courseId)
        .order('student(student_id)', { ascending: true });

      const exportData = enrollments.map(e => {
        const student = e.student;
        const assignmentSummary = summaryData?.find(s => s.student_id === student.id);
        const totalWorkScore = assignmentSummary?.final_assignment_score || 0;
        
        const midtermRaw = examScores?.find(es => es.student_id === student.id && es.exam_id === exportSettings.midterm_exam_id)?.score || 0;
        const finalRaw = examScores?.find(es => es.student_id === student.id && es.exam_id === exportSettings.final_exam_id)?.score || 0;

        // Logic 4 ช่อง + ปัดขึ้นทุกกรณี (Math.ceil)
        const totalFull = currentCourse.assignment_total_score;
        const weightBefore = exportSettings.before_midterm_weight;
        
        const workBefore = Math.ceil((totalWorkScore / totalFull) * weightBefore);
        const midtermScore = Math.ceil(midtermRaw);
        const workAfter = Math.ceil(totalWorkScore - ((totalWorkScore / totalFull) * weightBefore));
        const finalScore = Math.ceil(finalRaw);

        return {
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          before_midterm: workBefore,
          midterm_exam: midtermScore,
          after_midterm: workAfter,
          final_exam: finalScore,
          total_score: workBefore + midtermScore + workAfter + finalScore
        };
      });

      // 4. สร้าง CSV (ไม่ใส่คอลัมน์ 'no')
      const csv = Papa.unparse(exportData, {
        header: true,
        columns: [
          'student_id',
          'first_name',
          'last_name',
          'before_midterm',
          'midterm_exam',
          'after_midterm',
          'final_exam',
          'total_score'
        ]
      });

      // ส่วนดาวน์โหลดไฟล์...
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `grades_${currentCourse.course_code}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          กลับ
        </button>
        
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Export ผลการเรียน
          </h1>
          
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-red-900 mb-2">พบข้อผิดพลาด:</p>
                  <ul className="list-disc list-inside text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {/* น้ำหนักคะแนนงาน */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                การถ่วงน้ำหนักคะแนนงาน
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คะแนนก่อนสอบกลางภาค
                  </label>
                  <input
                    type="number"
                    value={exportSettings.before_midterm_weight}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      before_midterm_weight: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    คะแนนหลังสอบกลางภาค
                  </label>
                  <input
                    type="number"
                    value={exportSettings.after_midterm_weight}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      after_midterm_weight: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  รวม: <strong>{exportSettings.before_midterm_weight + exportSettings.after_midterm_weight}</strong> คะแนน
                  {' '}/ {currentCourse.assignment_total_score} คะแนน
                </p>
              </div>
            </div>
            
            {/* เลือกการสอบ */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                เลือกการสอบ
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สอบกลางภาค
                  </label>
                  <select
                    value={exportSettings.midterm_exam_id}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      midterm_exam_id: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">-- เลือกการสอบ --</option>
                    {exams.map(exam => (
                      <option key={exam.id} value={exam.id}>
                        {exam.exam_name} ({exam.max_score} คะแนน)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สอบปลายภาค
                  </label>
                  <select
                    value={exportSettings.final_exam_id}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      final_exam_id: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">-- เลือกการสอบ --</option>
                    {exams.map(exam => (
                      <option key={exam.id} value={exam.id}>
                        {exam.exam_name} ({exam.max_score} คะแนน)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* ปุ่ม Export */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download size={20} />
                {loading ? 'กำลัง Export...' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
