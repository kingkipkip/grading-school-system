import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useNavigate, Link } from 'react-router-dom'
import { KeyRound, Mail, User, Loader2, GraduationCap } from 'lucide-react'

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'student'
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { signUp } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await signUp(formData.email, formData.password, formData.fullName, formData.role)
            // Auto login or redirect to login? 
            // Supabase auto signs in upon signup unless email confirmation is ON.
            // Assuming default behavior: auto sign in.
            alert('ลงทะเบียนสำเร็จ!')
            navigate('/dashboard')
        } catch (err) {
            setError('เกิดข้อผิดพลาด: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">ลงทะเบียนใหม่</h1>
                        <p className="text-gray-500">สร้างบัญชีผู้ใช้งานระบบ Grading School System</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    className="pl-10 ios-input"
                                    placeholder="สมชาย ใจดี"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="pl-10 ios-input"
                                    placeholder="user@school.ac.th"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="pl-10 ios-input"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะผู้ใช้งาน</label>
                            <div className="relative">
                                <GraduationCap className="absolute left-3 top-3 text-gray-400" size={20} />
                                <select
                                    className="pl-10 ios-input"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="student">นักเรียน (Student)</option>
                                    <option value="teacher">ครูผู้สอน (Teacher)</option>
                                </select>
                            </div>
                            {formData.role === 'teacher' && (
                                <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                                    ⚠️ บัญชีครูผู้สอนจะต้องได้รับการอนุมัติจากนายทะเบียนก่อน จึงจะสามารถใช้งานได้
                                </div>
                            )}
                        </div>


                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full ios-btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'สมัครสมาชิก'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        มีบัญชีอยู่แล้ว? <Link to="/login" className="text-blue-600 hover:underline">เข้าสู่ระบบ</Link>
                    </div>
                </div>
            </div >
        </div >
    )
}
