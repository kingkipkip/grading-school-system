import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { LogOut, User, Home, BookOpen, Users, Settings, Calendar, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Layout({ children }) {
    const { profile, signOut } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const navItems = [
        { icon: Home, label: 'หน้าแรก', path: '/dashboard', roles: ['teacher', 'student', 'registrar'] },
        { icon: BookOpen, label: 'รายวิชา', path: '/courses/create', roles: ['teacher', 'registrar'] }, // Teacher creates
        // Students see courses in Dashboard, but maybe a list view too?
        { icon: Users, label: 'ห้องเรียน', path: '/classrooms', roles: ['registrar'] },
        { icon: Calendar, label: 'ปีการศึกษา', path: '/academic-years', roles: ['registrar'] },
        { icon: Settings, label: 'ผู้ใช้งาน', path: '/users', roles: ['registrar'] },
    ]

    const filteredNav = navItems.filter(item => item.roles.includes(profile?.role))

    return (
        <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
            {/* Top Navbar */}
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 shadow-sm h-16">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                    {/* Logo */}
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 cursor-pointer" onClick={() => navigate('/dashboard')}>
                        GradeSystem
                    </h1>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        {filteredNav.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-2 text-sm font-medium transition-colors ${location.pathname === item.path ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        ))}

                        <div className="h-6 w-px bg-gray-200 mx-2"></div>

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                                <p className="text-[10px] uppercase text-blue-600 font-bold tracking-wider">
                                    {profile?.role}
                                </p>
                            </div>
                            <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 transition-colors" title="Sign Out">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-gray-600"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4 border-b pb-4">
                            <span className="font-bold text-lg">เมนู</span>
                            <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
                        </div>

                        {filteredNav.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex items-center gap-3 text-gray-700 p-2 hover:bg-gray-50 rounded-lg"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        ))}

                        <div className="mt-auto border-t pt-4">
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 text-red-600 w-full p-2 hover:bg-red-50 rounded-lg"
                            >
                                <LogOut size={20} />
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    )
}
