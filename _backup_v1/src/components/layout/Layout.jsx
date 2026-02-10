import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, RefreshCw, Home } from 'lucide-react'
import MobileMenu from '../ui/MobileMenu'
import BottomNav from '../ui/BottomNav'

export default function Layout({ children }) {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Top Navigation - Glassmorphism */}
      <nav className="glass-panel sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <MobileMenu />

              {/* Logo/Title */}
              {/* Logo/Title */}
              <div
                onClick={() => navigate('/dashboard')}
                className="cursor-pointer"
              >
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                  GradeSystem
                </h1>
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100/50 rounded-full transition-all"
                title="หน้าแรก"
              >
                <Home size={20} />
              </button>

              {profile?.role === 'registrar' && (
                <>
                  <button
                    onClick={() => navigate('/classrooms')}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-full transition-all"
                  >
                    จัดการห้องเรียน
                  </button>
                  <button
                    onClick={() => navigate('/academic-years')}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-full transition-all"
                  >
                    ปีการศึกษา
                  </button>
                  <button
                    onClick={() => navigate('/users')}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-full transition-all"
                  >
                    จัดการผู้ใช้
                  </button>
                </>
              )}

              <div className="h-6 w-px bg-gray-200 mx-2"></div>

              <div className="flex items-center gap-3 mr-2">
                <div className="text-right hidden xl:block">
                  <span className="text-sm font-medium text-gray-900 block leading-tight">{profile?.full_name}</span>
                  <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wide">
                    {profile?.role === 'teacher' ? 'TEACHER' :
                      profile?.role === 'registrar' ? 'REGISTRAR' : 'STUDENT'}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 shadow-sm border border-white">
                  <User size={20} />
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100/50 rounded-full transition-all"
                title="รีโหลดหน้าเว็บใหม่"
              >
                <RefreshCw size={18} />
              </button>

              <button
                onClick={handleSignOut}
                className="ios-btn bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-2 text-sm px-5 shadow-lg shadow-gray-200/50"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile User Info */}
            <div className="lg:hidden flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <User size={18} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-24 lg:pb-8 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <BottomNav />
    </div>
  )
}
