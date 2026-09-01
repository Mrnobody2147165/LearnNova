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
const Messages = lazy(() => import('./routes/admin/Messages'))
const Classes = lazy(() => import('./routes/admin/Classes'))

// Student pages
const StudentDashboard = lazy(() => import('./routes/student/StudentDashboard'))
const StudentAttendance = lazy(() => import('./routes/student/StudentAttendance'))
const StudentHomework = lazy(() => import('./routes/student/StudentHomework'))
const StudentHomeworkDetails = lazy(() => import('./routes/student/StudentHomeworkDetails'))
const StudentFees = lazy(() => import('./routes/student/StudentFees'))
const StudentProfile = lazy(() => import('./routes/student/StudentProfile'))
const StudentNotifications = lazy(() => import('./routes/student/StudentNotifications'))
const StudentSubjects = lazy(() => import('./routes/student/StudentSubjects'))
const StudentGrades = lazy(() => import('./routes/student/StudentGrades'))
const StudentExams = lazy(() => import('./routes/student/StudentExams'))
const StudentProgress = lazy(() => import('./routes/student/StudentProgress'))
const StudentSchedule = lazy(() => import('./routes/student/StudentSchedule'))

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Enforce role-based access: redirect to correct portal if role doesn't match
  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />
    }
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    if (user?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />
    }
    return <Navigate to="/admin/dashboard" replace />
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

          {/* Admin routes — prefixed with /admin */}
          <Route element={<ProtectedRoute requiredRole="admin"><AppLayout /></ProtectedRoute>}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/students" element={<Students />} />
            <Route path="/admin/students/:id" element={<StudentDetails />} />
            <Route path="/admin/classes" element={<Classes />} />
            <Route path="/admin/attendance" element={<Attendance />} />
            <Route path="/admin/homework" element={<Homework />} />
            <Route path="/admin/fees" element={<Fees />} />
            <Route path="/admin/fees/structure" element={<FeeStructure />} />
            <Route path="/admin/challans" element={<Challans />} />
            <Route path="/admin/challans/:id" element={<ChallanDetails />} />
            <Route path="/admin/payments" element={<Payments />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/messages" element={<Messages />} />
            <Route path="/admin/ai-assistant" element={<AIAssistant />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>

          {/* Student routes */}
          <Route element={<ProtectedRoute requiredRole="student"><StudentLayout /></ProtectedRoute>}>
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/subjects" element={<StudentSubjects />} />
            <Route path="/student/grades" element={<StudentGrades />} />
            <Route path="/student/exams" element={<StudentExams />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/homework" element={<StudentHomework />} />
            <Route path="/student/homework/:id" element={<StudentHomeworkDetails />} />
            <Route path="/student/progress" element={<StudentProgress />} />
            <Route path="/student/schedule" element={<StudentSchedule />} />
            <Route path="/student/notifications" element={<StudentNotifications />} />
            <Route path="/student/fees" element={<StudentFees />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>

          {/* Legacy redirects — old routes map to new /admin/* paths */}
          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/students" element={<Navigate to="/admin/students" replace />} />
          <Route path="/students/:id" element={<Navigate to="/admin/students" replace />} />
          <Route path="/attendance" element={<Navigate to="/admin/attendance" replace />} />
          <Route path="/homework" element={<Navigate to="/admin/homework" replace />} />
          <Route path="/fees" element={<Navigate to="/admin/fees" replace />} />
          <Route path="/fees/structure" element={<Navigate to="/admin/fees/structure" replace />} />
          <Route path="/challans" element={<Navigate to="/admin/challans" replace />} />
          <Route path="/challans/:id" element={<Navigate to="/admin/challans" replace />} />
          <Route path="/payments" element={<Navigate to="/admin/payments" replace />} />
          <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
          <Route path="/ai-assistant" element={<Navigate to="/admin/ai-assistant" replace />} />
          <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
          <Route path="/fee" element={<Navigate to="/admin/fees" replace />} />
          <Route path="/academics/*" element={<Navigate to="/admin/attendance" replace />} />

          {/* Student legacy redirects */}
          <Route path="/student/challans" element={<Navigate to="/student/fees" replace />} />
          <Route path="/student/payments" element={<Navigate to="/student/fees" replace />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  )
}
