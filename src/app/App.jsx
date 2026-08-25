import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import AppLayout from '../components/layout/AppLayout'
import StudentLayout from '../components/layout/StudentLayout'
import ToastContainer from '../components/ui/Toast'
import LoadingState from '../components/ui/LoadingState'

const Login = lazy(() => import('./routes/auth/Login'))
const Signup = lazy(() => import('./routes/auth/Signup'))
const ForgotPassword = lazy(() => import('./routes/auth/ForgotPassword'))
const SchoolSetup = lazy(() => import('./routes/onboarding/SchoolSetup'))

// Admin pages
const Dashboard = lazy(() => import('./routes/admin/Dashboard'))
const Students = lazy(() => import('./routes/admin/Students'))
const StudentDetails = lazy(() => import('./routes/admin/StudentDetails'))
const Fees = lazy(() => import('./routes/admin/Fees'))
const FeeStructure = lazy(() => import('./routes/admin/FeeStructure'))
const Challans = lazy(() => import('./routes/admin/Challans'))
const ChallanDetails = lazy(() => import('./routes/admin/ChallanDetails'))
const Payments = lazy(() => import('./routes/admin/Payments'))
const Attendance = lazy(() => import('./routes/admin/Attendance'))
const Homework = lazy(() => import('./routes/admin/Homework'))
const Reports = lazy(() => import('./routes/admin/Reports'))
const AIAssistant = lazy(() => import('./routes/admin/AIAssistant'))
const Settings = lazy(() => import('./routes/admin/Settings'))

// Student pages
const StudentDashboard = lazy(() => import('./routes/student/StudentDashboard'))
const StudentAttendance = lazy(() => import('./routes/student/StudentAttendance'))
const StudentHomework = lazy(() => import('./routes/student/StudentHomework'))
const StudentHomeworkDetails = lazy(() => import('./routes/student/StudentHomeworkDetails'))
const StudentFees = lazy(() => import('./routes/student/StudentFees'))
const StudentProfile = lazy(() => import('./routes/student/StudentProfile'))

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, switchRole } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role && user.role !== role) {
    switchRole(role)
  }
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'student' ? '/student/dashboard' : '/dashboard'} replace />
  }
  return children
}

function PageLoader() {
  return (
    <div className="p-6">
      <LoadingState />
    </div>
  )
}

function FeeRedirectHandler() {
  const { user } = useAuthStore()
  if (user?.role === 'student') {
    return <Navigate to="/student/fees" replace />
  }
  return <Navigate to="/fees" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><SchoolSetup /></ProtectedRoute>} />

          {/* Smart fee entry point */}
          <Route path="/fee" element={<ProtectedRoute><FeeRedirectHandler /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetails />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/homework" element={<Homework />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/fees/structure" element={<FeeStructure />} />
            <Route path="/challans" element={<Challans />} />
            <Route path="/challans/:id" element={<ChallanDetails />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Student routes */}
          <Route element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/homework" element={<StudentHomework />} />
            <Route path="/student/homework/:id" element={<StudentHomeworkDetails />} />
            <Route path="/student/fees" element={<StudentFees />} />
            <Route path="/student/schedule" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/notifications" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>

          {/* Legacy & smart redirects */}
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/challans" element={<Navigate to="/student/fees" replace />} />
          <Route path="/student/payments" element={<Navigate to="/student/fees" replace />} />
          <Route path="/academics/attendance" element={<Navigate to="/attendance" replace />} />
          <Route path="/academics/homework" element={<Navigate to="/homework" replace />} />
          <Route path="/academics/*" element={<Navigate to="/attendance" replace />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  )
}
