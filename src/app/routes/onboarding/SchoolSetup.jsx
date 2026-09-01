import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Check, School, BookOpen, Wallet, PartyPopper } from 'lucide-react'
import { useSchoolStore } from '../../../stores/schoolStore'
import { useToast } from '../../../components/ui/Toast'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { cn } from '../../../utils/format'

const steps = [
  { id: 1, label: 'School Info', icon: School },
  { id: 2, label: 'Academic Setup', icon: BookOpen },
  { id: 3, label: 'Fee Setup', icon: Wallet },
  { id: 4, label: 'Complete', icon: PartyPopper },
]

export default function SchoolSetup() {
  const navigate = useNavigate()
  const { completeSetup } = useSchoolStore()
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: 'Greenfield Academy',
    address: '',
    phone: '',
    email: '',
    session: '2026-2027',
    classes: 'Class 1, Class 2, Class 3, Class 4, Class 5',
    sections: 'A, B',
    tuition: 8000,
    transport: 2000,
    other: 1000,
    dueDate: 10,
    lateFee: 200,
  })

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleFinish = () => {
    completeSetup({
      name: form.name,
      address: form.address,
      phone: form.phone,
      email: form.email,
      session: form.session,
      classes: form.classes.split(',').map(c => c.trim()),
      sections: form.sections.split(',').map(s => s.trim()),
      fees: {
        tuition: Number(form.tuition),
        transport: Number(form.transport),
        other: Number(form.other),
        dueDate: Number(form.dueDate),
        lateFee: Number(form.lateFee),
      },
    })
    toast.success('School setup complete!')
    navigate('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-surface-app py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-card bg-primary flex items-center justify-center mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-ink">Set up your school</h1>
          <p className="text-sm text-ink-secondary mt-1">Complete these steps to get started</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isComplete = step > s.id
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                    isComplete ? 'bg-primary text-white' : isActive ? 'bg-primary text-white' : 'bg-surface-hover text-ink-muted'
                  )}>
                    {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={cn('text-xs font-medium whitespace-nowrap', isActive ? 'text-ink' : 'text-ink-muted')}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-2 -mt-5 transition-colors', step > s.id ? 'bg-primary' : 'bg-border')} />
                )}
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div className="card p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-ink mb-1">School Information</h2>
              <p className="text-sm text-ink-secondary mb-4">Tell us about your school</p>
              <Input label="School Name" value={form.name} onChange={setField('name')} placeholder="e.g. Greenfield Academy" />
              <Input label="Address" value={form.address} onChange={setField('address')} placeholder="School address" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Phone" value={form.phone} onChange={setField('phone')} placeholder="+92 21 3456 7890" />
                <Input label="Email" type="email" value={form.email} onChange={setField('email')} placeholder="info@school.edu.pk" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-ink mb-1">Academic Setup</h2>
              <p className="text-sm text-ink-secondary mb-4">Configure your academic structure</p>
              <Input label="Academic Session" value={form.session} onChange={setField('session')} placeholder="e.g. 2026-2027" />
              <Input label="Classes (comma-separated)" value={form.classes} onChange={setField('classes')} placeholder="Class 1, Class 2, ..." />
              <Input label="Sections (comma-separated)" value={form.sections} onChange={setField('sections')} placeholder="A, B, C" />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-ink mb-1">Fee Setup</h2>
              <p className="text-sm text-ink-secondary mb-4">Configure your fee structure</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Tuition Fee (PKR)" type="number" value={form.tuition} onChange={setField('tuition')} />
                <Input label="Transport Fee (PKR)" type="number" value={form.transport} onChange={setField('transport')} />
                <Input label="Other Fees (PKR)" type="number" value={form.other} onChange={setField('other')} />
                <Input label="Due Date (day of month)" type="number" value={form.dueDate} onChange={setField('dueDate')} />
                <Input label="Late Fee (PKR)" type="number" value={form.lateFee} onChange={setField('lateFee')} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold text-ink mb-2">Your school is ready!</h2>
              <p className="text-sm text-ink-secondary mb-6 max-w-sm mx-auto">
                Let's start managing your school. You can always change these settings later.
              </p>
              <Button onClick={handleFinish}>
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
              <Button variant="ghost" onClick={handleBack} disabled={step === 1}>
                Back
              </Button>
              <Button onClick={handleNext}>
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
