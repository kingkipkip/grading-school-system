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

    // --- Student Claim Logic ---
    const [showClaimModal, setShowClaimModal] = useState(false)
    const [claimId, setClaimId] = useState('')
    const [claimError, setClaimError] = useState('')

    useEffect(() => {
        if (profile?.role === 'student' && !loading) {
            checkStudentLink()
        }
    }, [profile, loading])

    const checkStudentLink = async () => {
        // Check if this user is linked to any student record
        const { data } = await supabase.from('students').select('id').eq('user_id', profile.id).maybeSingle()
        if (!data) {
            setShowClaimModal(true)
        }
    }

    const handleClaimSubmit = async (e) => {
        e.preventDefault()
        setClaimError('')

        // Call the Secure RPC function
        const { data: success, error } = await supabase.rpc('claim_student_id', { student_id_input: claimId })

        if (error) {
            setClaimError(error.message)
        } else if (success) {
            alert('เชื่อมต่อข้อมูลสำเร็จ!')
            setShowClaimModal(false)
            fetchCourses() // Reload courses
        } else {
            setClaimError('ไม่พบรหัสนักเรียนนี้ หรือถูกใช้งานไปแล้ว')
        }
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

            {/* Registrar Quick Actions */}
            {profile?.role === 'registrar' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div onClick={() => navigate('/users')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">จัดการผู้ใช้งาน</h3>
                            <p className="text-sm text-gray-500">อนุมัติครู, แต่งตั้งนายทะเบียน</p>
                        </div>
                    </div>
                    <div onClick={() => navigate('/academic-years')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">ปีการศึกษา</h3>
                            <p className="text-sm text-gray-500">จัดการปีการศึกษาและภาคเรียน</p>
                        </div>
                    </div>
                    <div onClick={() => navigate('/classrooms')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">จัดการห้องเรียน</h3>
                            <p className="text-sm text-gray-500">เพิ่ม/ลบ ห้องเรียนในระบบ</p>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Claim Student ID Modal */}
            {showClaimModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-8 animate-fade-in shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                <User size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">เชื่อมต่อข้อมูลนักเรียน</h2>
                            <p className="text-gray-500 text-sm mt-2">กรุณาระบุรหัสนักเรียนของคุณ เพื่อดูรายวิชาและคะแนนสอบ</p>
                        </div>

                        {claimError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                <span className="font-bold">Error:</span> {claimError}
                            </div>
                        )}

                        <form onSubmit={handleClaimSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนักเรียน (Student ID)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="เช่น 66001"
                                    className="ios-input text-center text-lg tracking-widest font-mono"
                                    value={claimId}
                                    onChange={e => setClaimId(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="w-full ios-btn bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200">
                                ยืนยันข้อมูล
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
