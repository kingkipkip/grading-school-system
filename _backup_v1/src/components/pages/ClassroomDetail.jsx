import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Upload, Save, UserPlus, Trash2 } from 'lucide-react'
import Papa from 'papaparse'
import { useAuthStore } from '../../stores/authStore'

export default function ClassroomDetail() {
    const { classroomId } = useParams()
    const { profile } = useAuthStore()
    const [classroom, setClassroom] = useState(null)
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [importing, setImporting] = useState(false)
    const [previewData, setPreviewData] = useState(null)

    useEffect(() => {
        fetchClassroomData()
    }, [classroomId])

    const fetchClassroomData = async () => {
        setLoading(true)
        const { data: room } = await supabase
            .from('classrooms')
            .select('*')
            .eq('id', classroomId)
            .single()

        if (room) {
            setClassroom(room)
            const { data: st } = await supabase
                .from('students')
                .select('*')
                .eq('classroom_id', classroomId)
                .order('student_id')

            if (st) setStudents(st)
        }
        setLoading(false)
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data.length > 0) {
                    setPreviewData(results.data)
                }
            }
        })
    }

    const handleImport = async () => {
        setImporting(true)
        try {
            const { data: existingStudents } = await supabase
                .from('students')
                .select('student_id, id')

            const existingMap = new Map(existingStudents?.map(s => [s.student_id, s.id]))

            const upserts = []

            for (const row of previewData) {
                if (!row.student_id || !row.first_name || !row.last_name) continue

                // Prepare student data
                const studentData = {
                    student_id: row.student_id.trim(),
                    first_name: row.first_name.trim(),
                    last_name: row.last_name.trim(),
                    grade_level: classroom.name, // Auto-set grade level from classroom name? Or keep from CSV? Let's use CSV or Classroom name if missing.
                    classroom_id: classroomId,
                    // If we have other fields
                }

                // If ID exists, we update. If not, insert.
                // Supabase upsert requires primary key or unique constraint.
                // student_id is UNIQUE.
                // We can just upsert on student_id.

                upserts.push(studentData)
            }

            // Batch Upsert
            const { error } = await supabase
                .from('students')
                .upsert(upserts, { onConflict: 'student_id' })

            if (error) throw error

            alert(`นำเข้าสำเร็จ ${upserts.length} คน (อัปเดตข้อมูลล่าสุด)`)
            setPreviewData(null)
            fetchClassroomData()

        } catch (error) {
            console.error(error)
            alert('เกิดข้อผิดพลาด: ' + error.message)
        } finally {
            setImporting(false)
        }
    }

    const handleRemoveStudent = async (studentId) => {
        if (confirm('ต้องการนำนักเรียนออกจากห้องนี้ใช่หรือไม่? (ข้อมูลนักเรียนจะไม่ถูกลบจากระบบ)')) {
            await supabase
                .from('students')
                .update({ classroom_id: null })
                .eq('id', studentId)

            fetchClassroomData()
        }
    }

    const downloadTemplate = () => {
        const template = [
            { student_id: 'S001', first_name: 'สมชาย', last_name: 'รักเรียน' },
            { student_id: 'S002', first_name: 'สมหญิง', last_name: 'ใจดี' }
        ]
        const csv = Papa.unparse(template)
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'classroom_template.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (loading) return <div className="p-8 text-center">กำลังโหลด...</div>
    if (!classroom) return <div className="p-8 text-center">ไม่พบห้องเรียน</div>

    return (
        <div className="min-h-screen bg-[#F2F2F7]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Link to="/classrooms" className="group flex items-center gap-1 text-gray-500 hover:text-[#007AFF] mb-6 transition-colors font-medium">
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    กลับไปหน้ารายชื่อห้องเรียน
                </Link>

                <div className="ios-card mb-6 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{classroom.name}</h1>
                            <div className="flex items-center gap-4 text-gray-600">
                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    ปีการศึกษา {classroom.academic_year}
                                </span>
                                <span className="flex items-center gap-1 text-sm">
                                    <Users size={16} />
                                    {students.length} นักเรียน
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                            <label className="cursor-pointer group flex flex-col items-center justify-center w-full md:w-64 h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#007AFF] hover:bg-blue-50/50 transition-all">
                                <div className="flex flex-col items-center gap-1 text-gray-500 group-hover:text-[#007AFF]">
                                    <Upload size={24} />
                                    <span className="text-sm font-medium">อัปโหลดไฟล์ CSV</span>
                                </div>
                                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                            </label>

                            <div className="flex justify-between w-full md:w-64 px-2">
                                <button onClick={downloadTemplate} className="text-xs text-gray-500 hover:text-[#007AFF] underline">
                                    โหลดไฟล์ตัวอย่าง
                                </button>
                                <span className="text-xs text-gray-400">max 500 rows</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50/50 text-blue-800 text-sm rounded-xl border border-blue-100/50 flex gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg h-fit text-blue-600">
                            <FileText size={18} />
                        </div>
                        <div>
                            <p className="font-semibold mb-1">คำแนะนำการนำเข้าข้อมูล</p>
                            <p className="text-blue-700/80 leading-relaxed">
                                ไฟล์ CSV ต้องมีคอลัมน์ <code>student_id</code>, <code>first_name</code>, <code>last_name</code> <br />
                                หากรหัสนักเรียนซ้ำกับที่มีอยู่ ระบบจะทำการ <strong>อัปเดตข้อมูล</strong> และย้ายนักเรียนคนนั้นมาที่ห้องนี้ทันที
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                {previewData && (
                    <div className="ios-card mb-6 p-6 border-2 border-[#007AFF]/20 animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-[#007AFF] flex items-center justify-center text-sm">
                                    {previewData.length}
                                </span>
                                รายการที่จะนำเข้า
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPreviewData(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full font-medium text-sm"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importing}
                                    className="ios-btn bg-[#007AFF] text-white hover:bg-[#0062cc] disabled:opacity-50"
                                >
                                    {importing ? 'กำลังบันทึก...' : 'ยืนยันการนำเข้า'}
                                </button>
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto custom-scrollbar border border-gray-200 rounded-xl">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-left font-semibold text-gray-600">รหัส</th>
                                        <th className="p-3 text-left font-semibold text-gray-600">ชื่อ-สกุล</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {previewData.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="p-3 font-mono text-gray-500">{row.student_id}</td>
                                            <td className="p-3">{row.first_name} {row.last_name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Student List */}
                <div className="ios-card overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">รายชื่อนักเรียนในห้อง</h3>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total: {students.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ลำดับ</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัสนักเรียน</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.length > 0 ? (
                                    students.map((student, index) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-gray-900 font-medium">{student.student_id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{student.first_name} {student.last_name}</td>
                                            <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleRemoveStudent(student.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                    title="เอาออกจากห้อง"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users size={32} className="text-gray-300" />
                                                <p>ยังไม่มีนักเรียนในห้องนี้</p>
                                                <p className="text-xs text-gray-400">อัปโหลดไฟล์ CSV เพื่อเพิ่มนักเรียน</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
