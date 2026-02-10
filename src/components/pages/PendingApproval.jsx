import { useAuthStore } from '../../stores/authStore'
import { LogOut, ShieldAlert } from 'lucide-react'

export default function PendingApproval() {
    const { signOut, profile } = useAuthStore()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 animate-fade-in">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert size={40} className="text-yellow-600" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">รอการอนุมัติสิทธิ์</h1>
                <p className="text-gray-500 mb-6">
                    บัญชีของคุณ ({profile?.email}) ได้รับการลงทะเบียนแล้ว <br />
                    แต่ต้องรอให้นายทะเบียน (Registrar) อนุมัติสิทธิ์ก่อน <br />
                    จึงจะสามารถเข้าใช้งานระบบได้
                </p>

                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-8">
                    ℹ️ โปรดแจ้งนายทะเบียนของคุณเพื่อดำเนินการอนุมัติ
                </div>

                <button
                    onClick={() => signOut()}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                >
                    <LogOut size={18} />
                    ออกจากระบบ
                </button>
            </div>
        </div>
    )
}
