import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Plus, User, Clock, ArrowRight } from 'lucide-react'

export default function Dashboard() {
    const { profile } = useAuthStore()
    const navigate = useNavigate()
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile) fetchCourses()
    }, [profile])

    const fetchCourses = async () => {
        setLoading(true)
        let query = supabase.from('courses').select('*, teacher:users(full_name)')

        // Filter logic based on role
        if (profile.role === 'teacher') {
            query = query.eq('teacher_id', profile.id)
        } else if (profile.role === 'student') {
            // Need to join enrollments
            // This is tricky with simple query, so we fetch enrollments first
            const { data: enrollments } = await supabase
                .from('course_enrollments')
                .select('course_id')
                .eq('student_id', profile.id) // Assuming profiles.id links to students table? 
            // WAIT: students table has user_id. We need to find student_id first.

            // Let's get student record first if student
            const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', profile.id).single()

            if (studentRec) {
                const { data: enrolled } = await supabase.from('course_enrollments').select('course_id').eq('student_id', studentRec.id)
                const courseIds = enrolled?.map(e => e.course_id) || []
                query = query.in('id', courseIds)
            } else {
                setCourses([])
                setLoading(false)
                return
            }
        }
        // Registrar sees all

        const { data, error } = await query.order('created_at', { ascending: false })
        if (data) setCourses(data)
        setLoading(false)
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">สวัสดี, {profile?.full_name} 👋</h1>
                    <p className="text-gray-500 mt-1">
                        ยินดีต้อนรับสู่ระบบจัดการผลการเรียน
                    </p>
                </div>
                {['teacher', 'registrar'].includes(profile?.role) && (
                    <Link
                        to="/courses/create"
                        className="ios-btn bg-[#007AFF] text-white hover:bg-[#0062cc] shadow-md shadow-blue-200"
                    >
                        <Plus size={20} /> สร้างรายวิชาใหม่
                    </Link>
                )}
            </div>

            {/* Stats / Quick Actions (Optional) */}

            {/* Course Grid */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="text-gray-400" size={24} />
                    รายวิชาของคุณ
                </h2>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse"></div>)}
                    </div>
                ) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <div key={course.id} className="ios-card group cursor-pointer hover:-translate-y-1 duration-300" onClick={() => navigate(`/courses/${course.id}`)}>
                                <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 flex flex-col justify-between text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                                    <div className="relative z-10">
                                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                                            {course.course_code}
                                        </span>
                                        <h3 className="text-xl font-bold mt-2 leading-tight line-clamp-2">{course.course_name}</h3>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                                        <User size={16} />
                                        <span>{course.teacher?.full_name || 'Unknown Teacher'}</span>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                                            {course.academic_year || 'N/A'}
                                        </span>
                                        <span className="text-blue-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                                            เข้าสู่วิชา <ArrowRight size={16} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <BookOpen size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">ยังไม่มีรายวิชา</h3>
                        <p className="text-gray-500 mt-1">เริ่มต้นด้วยการสร้างรายวิชาใหม่ หรือรอการลงทะเบียน</p>
                    </div>
                )}
            </div>
        </div>
    )
}
