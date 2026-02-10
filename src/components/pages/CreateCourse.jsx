import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { ArrowLeft, BookOpen, Calendar, Save } from 'lucide-react'

export default function CreateCourse() {
    const navigate = useNavigate()
    const { profile } = useAuthStore()
    const [loading, setLoading] = useState(false)

    // Data for dropdowns
    const [years, setYears] = useState([])
    const [semesters, setSemesters] = useState([])
    const [teachers, setTeachers] = useState([])

    const [form, setForm] = useState({
        course_code: '',
        course_name: '',
        description: '',
        academic_year_id: '',
        semester_id: '',
        teacher_id: profile?.id // Default to self if teacher
    })

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        const { data: yearsData } = await supabase.from('academic_years').select('*, semesters(*)')
        if (yearsData) setYears(yearsData || [])

        // If registrar, fetch all teachers and registrars
        if (profile?.role === 'registrar') {
            const { data: teachersData } = await supabase.from('users').select('*').in('role', ['teacher', 'registrar']).order('full_name')
            if (teachersData) setTeachers(teachersData)
        }
    }

    const handleYearChange = (yearId) => {
        const year = years.find(y => y.id === yearId)
        setForm({ ...form, academic_year_id: yearId, semester_id: '' }) // Reset semester
        if (year) {
            setSemesters(year.semesters || [])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        // Find academic year text (for fallback support)
        const yearObj = years.find(y => y.id === form.academic_year_id)

        const payload = {
            course_code: form.course_code,
            course_name: form.course_name,
            description: form.description,
            teacher_id: form.teacher_id,
            semester_id: form.semester_id || null,
            academic_year: yearObj?.year_name || ''
        }

        const { error } = await supabase.from('courses').insert([payload])

        if (error) {
            alert('Error creating course: ' + error.message)
        } else {
            navigate('/dashboard')
        }
        setLoading(false)
    }

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-900">
                <ArrowLeft size={20} /> ย้อนกลับ
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><BookOpen size={24} /></div>
                        สร้างรายวิชาใหม่
                    </h1>
                    <p className="text-gray-500 mt-1 pl-12">กรอกข้อมูลเพื่อเปิดรายวิชาสำหรับเทอมใหม่</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสวิชา</label>
                            <input
                                type="text" required className="ios-input" placeholder="ว21101"
                                value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อวิชา</label>
                            <input
                                type="text" required className="ios-input" placeholder="วิทยาศาสตร์พื้นฐาน"
                                value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบายรายวิชา (ถ้ามี)</label>
                        <textarea
                            className="ios-input min-h-[100px]" placeholder="รายละเอียดวิชา..."
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ปีการศึกษา</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                                <select
                                    required className="ios-input pl-10"
                                    value={form.academic_year_id} onChange={e => handleYearChange(e.target.value)}
                                >
                                    <option value="">เลือกปีการศึกษา</option>
                                    {years.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ภาคเรียน</label>
                            <select
                                required className="ios-input"
                                value={form.semester_id} onChange={e => setForm({ ...form, semester_id: e.target.value })}
                                disabled={!form.academic_year_id}
                            >
                                <option value="">เลือกภาคเรียน</option>
                                {semesters.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.semester_type === 'summer' ? 'Summer' : `เทอม ${s.semester_type}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {profile?.role === 'registrar' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ครูผู้สอน</label>
                            <select
                                required className="ios-input"
                                value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                            >
                                <option value="">เลือกครูผู้สอน</option>
                                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full ios-btn bg-[#007AFF] text-white hover:bg-[#0062cc] disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? 'กำลังบันทึก...' : 'สร้างรายวิชา'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
