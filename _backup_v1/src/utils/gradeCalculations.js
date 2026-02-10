/**
 * คำนวณคะแนนงานทั่วไป
 * @param {Array} submissions - การส่งงานของนักเรียน
 * @param {number} totalRegularScore - คะแนนงานทั่วไปรวม
 * @returns {number} คะแนนที่ได้
 */
export function calculateRegularAssignmentScore(submissions, totalRegularScore) {
  const totalAssignments = submissions.length

  if (totalAssignments === 0) return 0

  // แยกการส่งงานตามสถานะ
  const submitted = submissions.filter(s => s.submission_status === 'submitted').length
  const late = submissions.filter(s => s.submission_status === 'late').length


  // คำนวณคะแนนต่อครั้ง
  const scorePerAssignment = totalRegularScore / totalAssignments

  // คะแนนจากการส่งทันกำหนด (100%)
  const onTimeScore = submitted * scorePerAssignment

  // คะแนนจากการส่งช้า (80%)
  const lateScore = late * scorePerAssignment * 0.8

  // รวมคะแนน
  const totalScore = onTimeScore + lateScore

  return Math.round(totalScore * 100) / 100
}

/**
 * คำนวณคะแนนงานพิเศษ
 * @param {Array} specialAssignments - งานพิเศษทั้งหมด
 * @param {Array} submissions - การส่งงานของนักเรียน
 * @returns {number} คะแนนที่ได้
 */
export function calculateSpecialAssignmentScore(specialAssignments, submissions) {
  let totalScore = 0

  specialAssignments.forEach(assignment => {
    const submission = submissions.find(s => s.assignment_id === assignment.id)
    if (submission && submission.score !== null) {
      totalScore += parseFloat(submission.score)
    }
  })

  return Math.round(totalScore * 100) / 100
}

/**
 * คำนวณคะแนนสอบรวม
 * @param {Array} examScores - คะแนนสอบของนักเรียน
 * @returns {number} คะแนนที่ได้
 */
export function calculateTotalExamScore(examScores) {
  const total = examScores.reduce((sum, score) => {
    return sum + parseFloat(score.score || 0)
  }, 0)

  return Math.round(total * 100) / 100
}

/**
 * คำนวณเกรด
 * @param {number} totalScore - คะแนนรวม (จาก 100)
 * @returns {Object} { grade: string, gradePoint: number }
 */
export function calculateGrade(totalScore) {
  if (totalScore >= 80) return { grade: 'A', gradePoint: 4.0 }
  if (totalScore >= 75) return { grade: 'B+', gradePoint: 3.5 }
  if (totalScore >= 70) return { grade: 'B', gradePoint: 3.0 }
  if (totalScore >= 65) return { grade: 'C+', gradePoint: 2.5 }
  if (totalScore >= 60) return { grade: 'C', gradePoint: 2.0 }
  if (totalScore >= 55) return { grade: 'D+', gradePoint: 1.5 }
  if (totalScore >= 50) return { grade: 'D', gradePoint: 1.0 }
  return { grade: 'F', gradePoint: 0 }
}

/**
 * คำนวณคะแนนสำหรับ export (ถ่วงน้ำหนัก)
 * @param {number} assignmentScore - คะแนนงานที่ได้
 * @param {number} assignmentTotalScore - คะแนนงานเต็ม
 * @param {number} weight - น้ำหนักที่ต้องการ
 * @returns {number}
 */
export function calculateWeightedScore(assignmentScore, assignmentTotalScore, weight) {
  if (assignmentTotalScore === 0) return 0
  return Math.round((assignmentScore / assignmentTotalScore) * weight * 100) / 100
}

/**
 * ตรวจสอบว่าคะแนนสอบครบหรือไม่
 * @param {Array} exams - การสอบทั้งหมด
 * @param {number} examTotalScore - คะแนนสอบเต็ม
 * @returns {Object} { isComplete: boolean, used: number, remaining: number }
 */
export function validateExamScores(exams, examTotalScore) {
  const used = exams.reduce((sum, exam) => sum + parseFloat(exam.max_score), 0)
  const remaining = examTotalScore - used

  return {
    isComplete: remaining === 0,
    used: Math.round(used * 100) / 100,
    remaining: Math.round(remaining * 100) / 100
  }
}

/**
 * สร้างข้อมูลสำหรับ Export CSV
 * @param {Object} course - ข้อมูลรายวิชา
 * @param {Array} students - รายชื่อนักเรียน
 * @param {Object} exportSettings - การตั้งค่า export
 * @param {Object} scores - คะแนนทั้งหมด
 * @returns {Array} ข้อมูลสำหรับ CSV
 */
export function prepareExportData(course, students, exportSettings, scores) {
  return students.map(student => {
    const studentScores = scores[student.id] || {}

    // คะแนนงาน
    const assignmentScore = studentScores.assignmentScore || 0

    // คะแนนสอบ
    const midtermScore = studentScores.midtermScore || 0
    const finalScore = studentScores.finalScore || 0

    // คำนวณคะแนนถ่วงน้ำหนัก
    const beforeMidterm = calculateWeightedScore(
      assignmentScore,
      course.assignment_total_score,
      exportSettings.before_midterm_weight
    )

    const afterMidterm = calculateWeightedScore(
      assignmentScore,
      course.assignment_total_score,
      exportSettings.after_midterm_weight
    )

    // คะแนนรวม
    const totalScore = beforeMidterm + midtermScore + afterMidterm + finalScore

    // เกรด
    const gradeInfo = calculateGrade(totalScore)

    return {
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      before_midterm: beforeMidterm,
      midterm_exam: midtermScore,
      after_midterm: afterMidterm,
      final_exam: finalScore,
      total_score: Math.round(totalScore * 100) / 100,
      grade: gradeInfo.grade,
      grade_point: gradeInfo.gradePoint
    }
  })
}
