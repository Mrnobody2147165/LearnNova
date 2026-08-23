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
const Teachers = lazy(() => import('./routes/admin/Teachers'))
const Classes = lazy(() => import('./routes/admin/Classes'))
const Subjects = lazy(() => import('./routes/admin/Subjects'))
const Fees = lazy(() => import('./routes/admin/Fees'))
const FeeStructure = lazy(() => import('./routes/admin/FeeStructure'))
const Challans = lazy(() => import('./routes/admin/Challans'))
const ChallanDetails = lazy(() => import('./routes/admin/ChallanDetails'))
const Payments = lazy(() => import('./routes/admin/Payments'))
const Attendance = lazy(() => import('./routes/admin/Attendance'))
const Academics = lazy(() => import('./routes/admin/Academics'))
const Exams = lazy(() => import('./routes/admin/Exams'))
const Grades = lazy(() => import('./routes/admin/Grades'))
const Homework = lazy(() => import('./routes/admin/Homework'))
const Reports = lazy(() => import('./routes/admin/Reports'))
const Communications = lazy(() => import('./routes/admin/Communications'))
const AIAssistant = lazy(() => import('./routes/admin/AIAssistant'))
const Settings = lazy(() => import('./routes/admin/Settings'))

// Other portals
const TeacherDashboard = lazy(() => import('./routes/teacher/TeacherDashboard'))
const ParentDashboard = lazy(() => import('./routes/parent/ParentDashboard'))

// Student pages
const StudentDashboard = lazy(() => import('./routes/student/StudentDashboard'))
const StudentSubjects = lazy(() => import('./routes/student/StudentSubjects'))
const StudentSubjectDetails = lazy(() => import('./routes/student/StudentSubjectDetails'))
const StudentGrades = lazy(() => import('./routes/student/StudentGrades'))
const StudentExams = lazy(() => import('./routes/student/StudentExams'))
const StudentAttendance = lazy(() => import('./routes/student/StudentAttendance'))
const StudentHomework = lazy(() => import('./routes/student/StudentHomework'))
const StudentHomeworkDetails = lazy(() => import('./routes/student/StudentHomeworkDetails'))
const StudentProgress = lazy(() => import('./routes/student/StudentProgress'))
const StudentSchedule = lazy(() => import('./routes/student/StudentSchedule'))
const StudentNotifications = lazy(() => import('./routes/student/StudentNotifications'))
const StudentProfile = lazy(() => import('./routes/student/StudentProfile'))

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'student' ? '/student/dashboard' : '/dashboard'} replace />
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

          {/* Admin routes */}
          <Route element={<ProtectedRoute role="admin"><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetails />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/fees/structure" element={<FeeStructure />} />
            <Route path="/challans" element={<Challans />} />
            <Route path="/challans/:id" element={<ChallanDetails />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/academics" element={<Academics />} />
            <Route path="/academics/exams" element={<Exams />} />
            <Route path="/academics/grades" element={<Grades />} />
            <Route path="/academics/attendance" element={<Attendance />} />
            <Route path="/academics/homework" element={<Homework />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/communications" element={<Communications />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/parent" element={<ParentDashboard />} />
          </Route>

          {/* Student routes */}
          <Route element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/subjects" element={<StudentSubjects />} />
            <Route path="/student/subjects/:id" element={<StudentSubjectDetails />} />
            <Route path="/student/grades" element={<StudentGrades />} />
            <Route path="/student/exams" element={<StudentExams />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/homework" element={<StudentHomework />} />
            <Route path="/student/homework/:id" element={<StudentHomeworkDetails />} />
            <Route path="/student/progress" element={<StudentProgress />} />
            <Route path="/student/schedule" element={<StudentSchedule />} />
            <Route path="/student/notifications" element={<StudentNotifications />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>

          {/* Legacy redirect */}
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  )
}
