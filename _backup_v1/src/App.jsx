import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import ErrorBoundary from './components/layout/ErrorBoundary'
import { ToastContainer } from './components/ui/Toast'
import LoadingSpinner from './components/ui/LoadingSpinner'
import InstallPWABanner from './components/ui/InstallPWABanner'

// Eager load critical components
import Login from './components/pages/Login'
import Layout from './components/layout/Layout'

// Lazy load route components
const Register = lazy(() => import('./components/pages/Register'))
const ForgotPassword = lazy(() => import('./components/pages/ForgotPassword'))
const UpdatePassword = lazy(() => import('./components/pages/UpdatePassword'))
const Dashboard = lazy(() => import('./components/pages/Dashboard'))
const CreateCourse = lazy(() => import('./components/pages/CreateCourse'))
const CourseDetail = lazy(() => import('./components/pages/CourseDetail'))
const ExportGrades = lazy(() => import('./components/pages/ExportGrades'))
const ImportStudents = lazy(() => import('./components/pages/ImportStudents'))
const CreateAssignment = lazy(() => import('./components/pages/CreateAssignment'))
const CreateExam = lazy(() => import('./components/pages/CreateExam'))
const GradingPage = lazy(() => import('./components/pages/GradingPage'))
const ClassroomList = lazy(() => import('./components/pages/ClassroomList'))
const ClassroomDetail = lazy(() => import('./components/pages/ClassroomDetail'))
const UserManagement = lazy(() => import('./components/pages/UserManagement'))
const AcademicYearManagement = lazy(() => import('./components/pages/AcademicYearManagement'))


// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" text="กำลังโหลด..." />
    </div>
  )
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </Layout>
  )
}

function App() {
  const initialize = useAuthStore(state => state.initialize)

  useEffect(() => {
    initialize()
  }, [])

  return (
    <ErrorBoundary>
      <ToastContainer />
      <InstallPWABanner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={
            <Suspense fallback={<PageLoader />}>
              <Register />
            </Suspense>
          } />
          <Route path="/forgot-password" element={
            <Suspense fallback={<PageLoader />}>
              <ForgotPassword />
            </Suspense>
          } />
          <Route path="/update-password" element={
            <Suspense fallback={<PageLoader />}>
              <UpdatePassword />
            </Suspense>
          } />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/create"
            element={
              <ProtectedRoute>
                <CreateCourse />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:courseId"
            element={
              <ProtectedRoute>
                <CourseDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:courseId/export"
            element={
              <ProtectedRoute>
                <ExportGrades />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:courseId/students/import"
            element={
              <ProtectedRoute>
                <ImportStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:courseId/assignments/create"
            element={
              <ProtectedRoute>
                <CreateAssignment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:courseId/exams/create"
            element={
              <ProtectedRoute>
                <CreateExam />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:courseId/grading"
            element={
              <ProtectedRoute>
                <GradingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/classrooms"
            element={
              <ProtectedRoute>
                <ClassroomList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/classrooms/:classroomId"
            element={
              <ProtectedRoute>
                <ClassroomDetail />
              </ProtectedRoute>
            }
          />


          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/academic-years"
            element={
              <ProtectedRoute>
                <AcademicYearManagement />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
