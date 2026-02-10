import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Plus, Edit, Trash2, Users, Upload, ArrowRight, ArrowLeft } from 'lucide-react'
import Papa from 'papaparse'
import { useAuthStore } from '../../stores/authStore'

export default function ClassroomList() {
    const { profile } = useAuthStore()
    const navigate = useNavigate()
    const [classrooms, setClassrooms] = useState([])
    const [importing, setImporting] = useState(false)

    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({ name: '', academic_year: '' })
    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        fetchClassrooms()
    }, [])

    const fetchClassrooms = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('classrooms')
            .select('*, students(count)')
            .order('name')

        if (data) setClassrooms(data)
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (editingId) {
            await supabase.from('classrooms').update(formData).eq('id', editingId)
        } else {
            await supabase.from('classrooms').insert(formData)
        }
        setShowModal(false)
        setFormData({ name: '', academic_year: '' })
        setEditingId(null)
        fetchClassrooms()
    }

    const handleDelete = async (id) => {
        if (confirm('คุณแน่ใจหรือไม่ที่จะลบห้องเรียนนี้? ข้อมูลนักเรียนในห้องนี้จะหลุดออกจากห้อง (แต่ไม่ถูกลบออกจากระบบ)')) {
            await supabase.from('classrooms').delete().eq('id', id)
            fetchClassrooms()
        }
    }

    const openEdit = (classroom) => {
        setFormData({ name: classroom.name, academic_year: classroom.academic_year })
        setEditingId(classroom.id)
        setShowModal(true)
    }

    const handleGlobalImport = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!confirm('ยืนยันการนำเข้าข้อมูล? ระบบจะสร้างห้องเรียนให้อัตโนมัติหากยังไม่มีในระบบ (อิงตามคอลัมน์ "classroom")')) {
            e.target.value = ''
            return
        }

        setImporting(true)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const rows = results.data
                    const logs = { success: 0, errors: [], createdClassrooms: 0 }

                    for (const row of rows) {
                        try {
                            if (!row.student_id || !row.first_name) continue

                            // 1. Find or Create Classroom
                            const classroomName = row.classroom || row.grade_level || row.room || 'Unassigned'
                            let classroomId

                            // Check local cache first (optimization)
                            // In a real app, might want to fetch or use a map
                            const { data: existingClass, error: findError } = await supabase
                                .from('classrooms')
                                .select('id')
                                .eq('name', classroomName)
                                .single()

                            if (existingClass) {
                                classroomId = existingClass.id
                            } else {
                                // Create new
                                const { data: newClass, error: createError } = await supabase
                                    .from('classrooms')
                                    .insert({
                                        name: classroomName,
                                        academic_year: new Date().getFullYear() + 543 // Default to current Thai year
                                    })
                                    .select()
                                    .single()

                                if (createError) throw new Error(`สร้างห้อง ${classroomName} ไม่สำเร็จ: ${createError.message}`)
                                classroomId = newClass.id
                                logs.createdClassrooms++
                            }

                            // 2. Upsert Student
                            const { error: studentError } = await supabase
                                .from('students')
                                .upsert({
                                    student_id: row.student_id.trim(),
                                    first_name: row.first_name.trim(),
                                    last_name: row.last_name?.trim() || '',
                                    classroom_id: classroomId,
                                    grade_level: classroomName // Keep consistent
                                }, { onConflict: 'student_id' })

                            if (studentError) throw studentError
                            logs.success++

                        } catch (err) {
                            logs.errors.push(`${row.student_id || 'Unknown'}: ${err.message}`)
                        }
                    }

                    alert(`นำเข้าเสร็จสิ้น!\n- สำเร็จ: ${logs.success} คน\n- สร้างห้องเรียนใหม่: ${logs.createdClassrooms} ห้อง\n- ผิดพลาด: ${logs.errors.length} รายการ\n${logs.errors.slice(0, 5).join('\n')}`)
                    fetchClassrooms()

                } catch (err) {
                    alert('เกิดข้อผิดพลาดร้ายแรง: ' + err.message)
                } finally {
                    setImporting(false)
                    e.target.value = ''
                }
            },
            error: (err) => {
                alert('อ่านไฟล์ CVS ไม่สำเร็จ: ' + err.message)
                setImporting(false)
            }
        })
    }

    if (profile?.role !== 'registrar') {
        return <div className="p-8 text-center text-red-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>
    }

    return (
        <div className="min-h-screen bg-[#F2F2F7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mb-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft size={20} className="mr-1" />
                            กลับไปหน้าแดชบอร์ด
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">จัดการข้อมูลนักเรียนและห้องเรียน</h1>
                        <p className="text-gray-500">จัดการรายชื่อนักเรียน แบ่งห้องเรียน และเลื่อนชั้นปี</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv"
                                id="global-import"
                                onChange={handleGlobalImport}
                                className="hidden"
                                disabled={importing}
                            />
                            <label
                                htmlFor="global-import"
                                className={`flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {importing ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                ) : (
                                    <Upload size={20} />
                                )}
                                <span>{importing ? 'กำลังนำเข้า...' : 'นำเข้า CSV (สร้างห้องอัตโนมัติ)'}</span>
                            </label>
                        </div>
                        <button
                            onClick={() => {
                                const csvContent = "student_id,first_name,last_name,classroom\n67001,สมชาย,ใจดี,ม.1/1\n67002,สมหญิง,รักเรียน,ม.1/1\n67003,John,Doe,ม.1/2"
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                                const link = document.createElement('a')
                                if (link.download !== undefined) {
                                    const url = URL.createObjectURL(blob)
                                    link.setAttribute('href', url)
                                    link.setAttribute('download', 'student_import_template.csv')
                                    link.style.visibility = 'hidden'
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            <span>ตัวอย่าง CSV</span>
                        </button>
                        <button
                            onClick={() => {
                                setFormData({ name: '', academic_year: '' })
                                setEditingId(null)
                                setShowModal(true)
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0062cc] transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            <span>สร้างห้องเรียน</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007AFF]"></div>
                    </div>
                ) : classrooms.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <Users className="mx-auto text-gray-300 mb-4" size={64} />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">ยังไม่มีข้อมูลห้องเรียน/นักเรียน</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            คุณสามารถสร้างห้องเรียนด้วยตนเอง หรือใช้ปุ่ม <strong>"นำเข้า CSV"</strong> เพื่ออัปโหลดรายชื่อนักเรียนพร้อมสร้างห้องให้อัตโนมัติ (โดยระบุคอลัมน์ classroom ในไฟล์)
                        </p>
                        <label
                            htmlFor="global-import"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#007AFF] text-white rounded-xl hover:bg-[#0062cc] transition-colors shadow-lg shadow-blue-200 cursor-pointer"
                        >
                            <Upload size={20} />
                            นำเข้าข้อมูลนักเรียน (CSV)
                        </label>
                        <button
                            onClick={() => {
                                const csvContent = "student_id,first_name,last_name,classroom\n67001,สมชาย,ใจดี,ม.1/1\n67002,สมหญิง,รักเรียน,ม.1/1\n67003,John,Doe,ม.1/2"
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                                const link = document.createElement('a')
                                link.href = URL.createObjectURL(blob)
                                link.download = 'student_import_template.csv'
                                link.click()
                            }}
                            className="block mx-auto mt-4 text-sm text-primary-600 hover:underline"
                        >
                            ดาวน์โหลดไฟล์ตัวอย่าง CSV
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                        {classrooms.map((room) => (
                            <div key={room.id} className="ios-card p-6 group cursor-pointer hover:border-blue-400 transition-all" onClick={() => navigate(`/classrooms/${room.id}`)}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#007AFF] transition-colors">{room.name}</h3>
                                            {room.academic_year === String(new Date().getFullYear() + 543) && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-bold">ปีนี้</span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1">ปีการศึกษา {room.academic_year}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEdit(room); }}
                                            className="p-1.5 text-gray-400 hover:text-[#007AFF] hover:bg-blue-50 rounded-lg transition-all"
                                            title="แก้ไข"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(room.id); }}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="ลบ"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-end justify-between">
                                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg text-sm">
                                        <Users size={16} />
                                        <span className="font-semibold">{room.students?.[0]?.count || 0}</span>
                                        <span className="text-xs font-normal text-gray-400">คน</span>
                                    </div>
                                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#007AFF] group-hover:text-white transition-all">
                                        <ArrowRight size={16} className="-rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">
                                {editingId ? 'แก้ไขห้องเรียน' : 'สร้างห้องเรียนใหม่'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อห้องเรียน (เช่น ม.1/1)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ปีการศึกษา (เช่น 2567)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.academic_year}
                                        onChange={e => setFormData({ ...formData, academic_year: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                    >
                                        บันทึก
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
