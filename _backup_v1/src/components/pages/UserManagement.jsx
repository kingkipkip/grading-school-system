import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { Check, X, Shield, User, GraduationCap, Search, ArrowLeft } from 'lucide-react'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const { profile } = useAuthStore()

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
            alert('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const updateUserRole = async (userId, newRole) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะเปลี่ยนสิทธิ์ผู้ใช้นี้เป็น "${newRole}"?`)) return

        try {
            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId)

            if (error) throw error

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))

        } catch (error) {
            console.error('Error updating role:', error)
            alert('เกิดข้อผิดพลาดในการอัปเดตสิทธิ์: ' + error.message)
        }
    }

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getRoleBadge = (role) => {
        switch (role) {
            case 'registrar':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 flex items-center gap-1"><Shield size={12} /> ทะเบียน (Admin)</span>
            case 'teacher':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center gap-1"><User size={12} /> ครู</span>
            default:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 flex items-center gap-1"><GraduationCap size={12} /> นักเรียน</span>
        }
    }

    if (profile?.role !== 'registrar') {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-gray-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (สำหรับเจ้าหน้าที่ทะเบียนเท่านั้น)</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <button
                        onClick={() => window.history.back()}
                        className="mb-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-1" />
                        ย้อนกลับ
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
                    <p className="text-gray-600">อนุมัติและกำหนดสิทธิ์การใช้งานระบบ</p>
                </div>

                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                        placeholder="ค้นหาชื่อ หรือ อีเมล..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ชื่อ-นามสกุล / อีเมล
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    สถานะปัจจุบัน
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    จัดการสิทธิ์
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                        กำลังโหลดข้อมูล...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                        ไม่พบข้อมูลผู้ใช้
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                {user.role !== 'teacher' && (
                                                    <button
                                                        onClick={() => updateUserRole(user.id, 'teacher')}
                                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
                                                    >
                                                        ตั้งเป็นครู
                                                    </button>
                                                )}
                                                {user.role !== 'registrar' && (
                                                    <button
                                                        onClick={() => updateUserRole(user.id, 'registrar')}
                                                        className="text-purple-600 hover:text-purple-900 bg-purple-50 px-3 py-1 rounded-md hover:bg-purple-100 transition-colors"
                                                    >
                                                        ตั้งเป็นทะเบียน
                                                    </button>
                                                )}
                                                {user.role !== 'student' && (
                                                    <button
                                                        onClick={() => updateUserRole(user.id, 'student')}
                                                        className="text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
                                                    >
                                                        เป็นนักเรียน
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
