import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, GraduationCap, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { useToast } from '../../../components/ui/Toast'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Button from '../../../components/ui/Button'

export default function Signup() {
  const navigate = useNavigate()
  const { signup, loading } = useAuthStore()
  const toast = useToast()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', studentId: '', class: '', section: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.fullName) errs.fullName = 'Full name is required'
    else if (form.fullName.length < 2) errs.fullName = 'Name must be at least 2 characters'
    if (!form.email) errs.email = 'Email is required'
    else if (!form.email.includes('@')) errs.email = 'Please enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match'
    if (!form.studentId) errs.studentId = 'Student ID is required'
    if (!form.class) errs.class = 'Class is required'
    if (!form.section) errs.section = 'Section is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await signup(form)
      toast.success('Student account created successfully!')
      navigate('/student/dashboard')
    } catch (err) {
      setErrors({ form: err.message })
    }
  }

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-app p-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-card bg-primary flex items-center justify-center mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-ink">Create student account</h1>
          <p className="text-sm text-ink-secondary mt-1">Register to access your student portal</p>
        </div>

        <div className="card p-6">
          {errors.form && (
            <div className="mb-4 p-3 rounded-btn bg-danger-bg text-danger text-sm">
              {errors.form}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" placeholder="e.g. Ahmed Khan" icon={User} value={form.fullName} onChange={setField('fullName')} error={errors.fullName} />
            <Input label="Email" type="email" placeholder="student@email.com" icon={Mail} value={form.email} onChange={setField('email')} error={errors.email} />
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" icon={Lock} value={form.password} onChange={setField('password')} error={errors.password} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-ink-muted hover:text-ink" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input label="Confirm Password" type={showPassword ? 'text' : 'password'} placeholder="Re-enter password" icon={Lock} value={form.confirmPassword} onChange={setField('confirmPassword')} error={errors.confirmPassword} />
            <Input label="Student ID" placeholder="e.g. STU-2026-00124" value={form.studentId} onChange={setField('studentId')} error={errors.studentId} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Class" value={form.class} onChange={setField('class')} error={errors.class}>
                <option value="">Select class</option>
                {['1','2','3','4','5','6','7','8','9','10'].map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
              </Select>
              <Select label="Section" value={form.section} onChange={setField('section')} error={errors.section}>
                <option value="">Select section</option>
                {['A','B','C'].map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>

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
