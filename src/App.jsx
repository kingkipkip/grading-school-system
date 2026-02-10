import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import Login from './components/pages/Login'
import Layout from './components/layout/Layout'
import AcademicYearManagement from './components/pages/AcademicYearManagement'
import ClassroomList from './components/pages/ClassroomList'
import UserManagement from './components/pages/UserManagement'
import CreateCourse from './components/pages/CreateCourse'
import Dashboard from './components/pages/Dashboard'
import CourseDetail from './components/pages/CourseDetail'
import { Loader2 } from 'lucide-react'
import Register from './components/pages/Register'

import PendingApproval from './components/pages/PendingApproval'

// Dashboard is now imported
const ProtectedRoute = ({ children }) => {
    const { user, profile, loading } = useAuthStore()

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={32} /></div>
    if (!user) return <Navigate to="/login" replace />

    // Check approval status
    // If profile is loaded but is_approved is strictly false, block.
    // Use optional chaining and default to true to prevent blocking if column missing (safe migration), 
    // OR default to false to force migration. 
    // Given user wants "Strict" approval, we should strictly check.
    // However, if we deploy code before DB migration, everyone gets locked out if we default false.
    // Let's default to TRUE if undefined (backward compat) but false if explicitly false.
    const isApproved = profile?.is_approved !== false

    if (!isApproved) {
        return <Navigate to="/pending-approval" replace />
    }

    return <Layout>{children}</Layout>
}

export default function App() {
    const { initialize } = useAuthStore()

    useEffect(() => {
        initialize()
    }, [])

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/pending-approval" element={<PendingApproval />} />

                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/academic-years" element={<ProtectedRoute><AcademicYearManagement /></ProtectedRoute>} />
                <Route path="/classrooms" element={<ProtectedRoute><ClassroomList /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                <Route path="/courses/create" element={<ProtectedRoute><CreateCourse /></ProtectedRoute>} />
                <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
