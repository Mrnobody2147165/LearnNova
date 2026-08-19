import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import AppLayout from '../components/layout/AppLayout'
import ToastContainer, { useToast } from '../components/ui/Toast'
import LoadingState from '../components/ui/LoadingState'

const Login = lazy(() => import('./routes/auth/Login'))
const Signup = lazy(() => import('./routes/auth/Signup'))
const ForgotPassword = lazy(() => import('./routes/auth/ForgotPassword'))
const SchoolSetup = lazy(() => import('./routes/onboarding/SchoolSetup'))
const Dashboard = lazy(() => import('./routes/admin/Dashboard'))
const Students = lazy(() => import('./routes/admin/Students'))
const StudentDetails = lazy(() => import('./routes/admin/StudentDetails'))
const Teachers = lazy(() => import('./routes/admin/Teachers'))
const Classes = lazy(() => import('./routes/admin/Classes'))
const Fees = lazy(() => import('./routes/admin/Fees'))
const FeeStructure = lazy(() => import('./routes/admin/FeeStructure'))
const Challans = lazy(() => import('./routes/admin/Challans'))
const ChallanDetails = lazy(() => import('./routes/admin/ChallanDetails'))
const Payments = lazy(() => import('./routes/admin/Payments'))
const Attendance = lazy(() => import('./routes/admin/Attendance'))
const Academics = lazy(() => import('./routes/admin/Academics'))
const Reports = lazy(() => import('./routes/admin/Reports'))
const Communications = lazy(() => import('./routes/admin/Communications'))
const AIAssistant = lazy(() => import('./routes/admin/AIAssistant'))
const Settings = lazy(() => import('./routes/admin/Settings'))
const TeacherDashboard = lazy(() => import('./routes/teacher/TeacherDashboard'))
const ParentDashboard = lazy(() => import('./routes/parent/ParentDashboard'))
const StudentDashboard = lazy(() => import('./routes/student/StudentDashboard'))

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
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
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><SchoolSetup /></ProtectedRoute>} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetails />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/fees/structure" element={<FeeStructure />} />
            <Route path="/challans" element={<Challans />} />
            <Route path="/challans/:id" element={<ChallanDetails />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/academics" element={<Academics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/communications" element={<Communications />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/student" element={<StudentDashboard />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  )
}
