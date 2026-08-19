import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, GraduationCap, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { useToast } from '../../../components/ui/Toast'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!email) errs.email = 'Email is required'
    else if (!email.includes('@')) errs.email = 'Please enter a valid email'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 4) errs.password = 'Password must be at least 4 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await login(email, password)
      toast.success('Welcome back! Login successful.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
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
          <p className="text-sm text-ink-secondary mt-1">Sign in to your school management account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@school.edu.pk"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
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
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-ink-secondary mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-ink-muted mt-6">
          Use any valid email and password to try the demo
        </p>
      </div>
    </div>
  )
}
