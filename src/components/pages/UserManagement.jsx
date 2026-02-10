import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, UserCog, Shield, Users } from 'lucide-react'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
        if (data) setUsers(data)
        setLoading(false)
    }

    const handleRoleChange = async (userId, newRole) => {
        if (!confirm(`เปลี่ยนสิทธิ์ผู้ใช้นี้เป็น ${newRole}?`)) return

        const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId)
        if (error) alert(error.message)
        else fetchUsers()
    }

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(filter.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
                    <p className="text-gray-500">จัดการสิทธิ์การเข้าถึงระบบ (ครู, นักเรียน, ทะเบียน)</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-20 z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ หรือ อีเมล..."
                        className="pl-10 ios-input"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">ผู้ใช้งาน</th>
                            <th className="p-4 font-semibold text-gray-600">อีเมล</th>
                            <th className="p-4 font-semibold text-gray-600">บทบาท</th>
                            <th className="p-4 font-semibold text-gray-600">สถานะ</th>
                            <th className="p-4 font-semibold text-gray-600">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                            <UserCog size={20} />
                                        </div>
                                        <span className="font-medium text-gray-900">{user.full_name || 'No Name'}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                        ${user.role === 'registrar' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                                                'bg-green-100 text-green-700'
                                        }
                                    `}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {user.is_approved === false ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                            รออนุมัติ
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                            อนุมัติแล้ว
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 flex items-center gap-2">
                                    <select
                                        className="text-sm border-gray-200 rounded-lg p-1 bg-white border shadow-sm focus:ring-2 focus:ring-blue-500"
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    >
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="registrar">Registrar</option>
                                    </select>

                                    {user.role === 'teacher' && user.is_approved === false && (
                                        <button
                                            onClick={async () => {
                                                if (!confirm('ยืนยันการอนุมัติบัญชีครู?')) return
                                                const { error } = await supabase.from('users').update({ is_approved: true }).eq('id', user.id)
                                                if (error) alert(error.message)
                                                else fetchUsers()
                                            }}
                                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 shadow-sm"
                                        >
                                            อนุมัติ
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-gray-500">ไม่พบข้อมูลผู้ใช้</div>
                )}
            </div>
        </div>
    )
}
