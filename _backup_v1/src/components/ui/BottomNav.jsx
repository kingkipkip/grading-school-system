import { Link, useLocation } from 'react-router-dom'
import { Home, BookOpen, Plus, User } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useIsMobile } from '../../hooks/useMediaQuery'

export default function BottomNav() {
  const location = useLocation()
  const profile = useAuthStore(state => state.profile)
  const isMobile = useIsMobile()

  if (!isMobile) return null

  const navItems = [
    {
      icon: Home,
      label: 'หน้าแรก',
      path: '/dashboard',
      show: true
    },
    {
      icon: Plus,
      label: 'สร้างวิชา',
      path: '/courses/create',
      show: profile?.role === 'teacher'
    },
    {
      icon: User,
      label: 'โปรไฟล์',
      path: '/profile',
      show: true
    }
  ].filter(item => item.show)

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                active
                  ? 'text-primary-600'
                  : 'text-gray-500 active:text-gray-700'
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
