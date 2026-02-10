import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useNavigate, Link } from 'react-router-dom'
import { KeyRound, Mail, Loader2 } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { signIn } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await signIn(email, password)
            navigate('/dashboard')
        } catch (err) {
            setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง (' + err.message + ')')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">เข้าสู่ระบบ</h1>
                        <p className="text-gray-500">ระบบจัดการผลการเรียน (Grading System)</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
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
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="pl-10 ios-input"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full ios-btn bg-[#007AFF] text-white hover:bg-[#0062cc] disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'เข้าสู่ระบบ'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        ยังไม่มีบัญชี? <Link to="/register" className="text-blue-600 hover:underline">ลงทะเบียนผู้ใช้งานใหม่</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
