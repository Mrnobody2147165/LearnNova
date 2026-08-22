import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, School, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { useSchoolStore } from '../../../stores/schoolStore'
import { useToast } from '../../../components/ui/Toast'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'

export default function Signup() {
  const navigate = useNavigate()
  const { signup, loading } = useAuthStore()
  const { updateSchool } = useSchoolStore()
  const toast = useToast()
  const [form, setForm] = useState({ fullName: '', schoolName: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.fullName) errs.fullName = 'Full name is required'
    else if (form.fullName.length < 2) errs.fullName = 'Name must be at least 2 characters'
    if (!form.schoolName) errs.schoolName = 'School name is required'
    if (!form.email) errs.email = 'Email is required'
    else if (!form.email.includes('@')) errs.email = 'Please enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await signup(form)
      updateSchool({ name: form.schoolName })
      toast.success('Account created successfully!')
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.message || 'Signup failed')
    }
  }

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-app p-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-card bg-primary flex items-center justify-center mb-3">
            <School className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
          <p className="text-sm text-ink-secondary mt-1">Start managing your school in minutes</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" placeholder="e.g. Ahmed Khan" icon={User} value={form.fullName} onChange={setField('fullName')} error={errors.fullName} />
            <Input label="School Name" placeholder="e.g. Greenfield Academy" icon={School} value={form.schoolName} onChange={setField('schoolName')} error={errors.schoolName} />
            <Input label="Email" type="email" placeholder="admin@school.edu.pk" icon={Mail} value={form.email} onChange={setField('email')} error={errors.email} />
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" icon={Lock} value={form.password} onChange={setField('password')} error={errors.password} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-ink-muted hover:text-ink" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input label="Confirm Password" type={showPassword ? 'text' : 'password'} placeholder="Re-enter password" icon={Lock} value={form.confirmPassword} onChange={setField('confirmPassword')} error={errors.confirmPassword} />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-ink-secondary mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
