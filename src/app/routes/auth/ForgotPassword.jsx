import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, GraduationCap, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { useToast } from '../../../components/ui/Toast'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { resetPassword, loading } = useAuthStore()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    if (!email.includes('@')) { setError('Please enter a valid email'); return }
    setError('')
    try {
      await resetPassword(email)
      setSent(true)
      toast.success('Password reset link sent!')
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-app p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-card bg-primary flex items-center justify-center mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-ink">Reset password</h1>
          <p className="text-sm text-ink-secondary mt-1">We'll send a reset link to your email</p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1">Check your email</h3>
              <p className="text-sm text-ink-secondary mb-4">We've sent a password reset link to {email}</p>
              <Button variant="secondary" onClick={() => navigate('/login')} className="w-full">
                Back to login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" type="email" placeholder="admin@school.edu.pk" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}

          <Link to="/login" className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mt-4 justify-center transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
