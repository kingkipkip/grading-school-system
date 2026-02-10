import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Menu, X, LogOut, User, Users, Home, BookOpen, Settings, Calendar } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
    setIsOpen(false)
  }

  const menuItems = [
    { icon: Home, label: 'แดชบอร์ด', path: '/dashboard' },
    ...(['teacher', 'registrar'].includes(profile?.role) ? [
      { icon: BookOpen, label: 'สร้างรายวิชา', path: '/courses/create' }
    ] : []),
    ...(profile?.role === 'registrar' ? [
      { icon: Users, label: 'จัดการห้องเรียน', path: '/classrooms' },
      { icon: Settings, label: 'จัดการผู้ใช้', path: '/users' },
      { icon: Calendar, label: 'ปฏิทินการศึกษา', path: '/academic-years' }
    ] : [])
  ]

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="เปิดเมนู"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl animate-slide-in-left">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{profile?.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {profile?.role === 'teacher' ? 'ครู' :
                        profile?.role === 'registrar' ? 'ทะเบียน' : 'นักเรียน'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
                  aria-label="ปิดเมนู"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">ออกจากระบบ</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
