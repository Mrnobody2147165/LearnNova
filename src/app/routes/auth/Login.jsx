import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, GraduationCap, Eye, EyeOff, Shield } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { useToast } from '../../../components/ui/Toast'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { cn } from '../../../utils/format'

const ADMIN_EMAIL = 'admin@learnify.com'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()
  const toast = useToast()
  const [role, setRole] = useState('admin')
  const [email, setEmail] = useState('admin@learnify.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    setErrors({})
    if (newRole === 'admin') {
      setEmail('admin@learnify.com')
    } else {
      setEmail('')
    }
    setPassword('')
  }

  const validate = () => {
    const errs = {}
    if (!email) errs.email = 'Email is required'
    else if (!email.includes('@')) errs.email = 'Please enter a valid email'

    if (role === 'admin' && email !== ADMIN_EMAIL) {
      errs.email = 'Only authorized admin credentials are accepted'
    }
    if (!password) errs.password = 'Password is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      const user = await login(email, password)
      toast.success('Welcome back! Login successful.')
      if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/student/dashboard')
      }
    } catch (err) {
      setErrors({ form: err.message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-app p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-card bg-primary flex items-center justify-center mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="text-sm text-ink-secondary mt-1">Sign in to Learnify</p>
        </div>

        {/* Role Toggle */}
        <div className="flex items-center p-1 bg-white border border-border rounded-card mb-5 gap-1">
          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-btn text-sm font-semibold transition-all duration-150',
              role === 'admin'
                ? 'bg-primary text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'
            )}
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('student')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-btn text-sm font-semibold transition-all duration-150',
              role === 'student'
                ? 'bg-primary text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'
            )}
          >
            <GraduationCap className="w-4 h-4" />
            Student
          </button>
        </div>

        <div className="card p-6">
          {errors.form && (
            <div className="mb-4 p-3 rounded-btn bg-danger-bg text-danger text-sm">
              {errors.form}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder={role === 'admin' ? 'admin@learnify.com' : 'student@email.com'}
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
              disabled={role === 'admin'}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-ink-muted hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-ink-secondary cursor-pointer">
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : `Sign in as ${role === 'admin' ? 'Admin' : 'Student'}`}
            </Button>
          </form>

          {role === 'student' && (
            <p className="text-center text-sm text-ink-secondary mt-4">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-ink-muted mt-6">
          {role === 'admin'
            ? 'Admin demo: admin@learnify.com / learnify'
            : 'Register as a student to access the student portal'}
        </p>
      </div>
    </div>
  )
}
