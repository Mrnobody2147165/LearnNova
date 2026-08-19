import { useState } from 'react'
import { School, User, Users, Bell, Wallet, BookOpen, Palette, Shield } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import { useToast } from '../../../components/ui/Toast'
import { useSchoolStore } from '../../../stores/schoolStore'
import { useAuthStore } from '../../../stores/authStore'
import { cn } from '../../../utils/format'

const sections = [
  { id: 'profile', label: 'School Profile', icon: School },
  { id: 'account', label: 'Account', icon: User },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'fees', label: 'Fee Settings', icon: Wallet },
  { id: 'academic', label: 'Academic Settings', icon: BookOpen },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function Settings() {
  const toast = useToast()
  const { school, updateSchool } = useSchoolStore()
  const { user } = useAuthStore()
  const [active, setActive] = useState('profile')
  const [form, setForm] = useState({
    name: school.name,
    address: school.address,
    phone: school.phone,
    email: school.email,
    session: school.session,
    tuition: school.fees?.tuition || 8000,
    transport: school.fees?.transport || 2000,
    dueDate: school.fees?.dueDate || 10,
    lateFee: school.fees?.lateFee || 200,
    userName: user?.name || 'Admin User',
    userEmail: user?.email || '',
    notifyUnpaid: true,
    notifyChallans: true,
    notifyPayments: false,
    notifyAdmissions: true,
    twoFactor: false,
  })

  const setField = (field) => (e) => {
    const value = typeof e.target.checked !== 'undefined' && e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    updateSchool({
      name: form.name,
      address: form.address,
      phone: form.phone,
      email: form.email,
      session: form.session,
      fees: { tuition: Number(form.tuition), transport: Number(form.transport), dueDate: Number(form.dueDate), lateFee: Number(form.lateFee) },
    })
    toast.success('Settings saved successfully')
  }

  const roles = [
    { id: 'R1', name: 'Admin User', email: user?.email || 'admin@school.edu.pk', role: 'Administrator', status: 'Active' },
    { id: 'R2', name: 'Sadia Rahman', email: 'sadia.r@school.edu.pk', role: 'Teacher', status: 'Active' },
    { id: 'R3', name: 'Kamran Akhtar', email: 'kamran.a@school.edu.pk', role: 'Teacher', status: 'Active' },
    { id: 'R4', name: 'Accounts Manager', email: 'accounts@school.edu.pk', role: 'Accountant', status: 'Active' },
  ]

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your school and account preferences" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {sections.map(s => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm font-medium whitespace-nowrap transition-colors',
                    active === s.id ? 'bg-primary-light text-primary' : 'text-ink-secondary hover:bg-surface-hover hover:text-ink'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{s.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {active === 'profile' && (
            <Card>
              <h3 className="text-base font-semibold text-ink mb-4">School Profile</h3>
              <div className="space-y-4 max-w-2xl">
                <Input label="School Name" value={form.name} onChange={setField('name')} />
                <Input label="Address" value={form.address} onChange={setField('address')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Phone" value={form.phone} onChange={setField('phone')} />
                  <Input label="Email" type="email" value={form.email} onChange={setField('email')} />
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </Card>
          )}

          {active === 'account' && (
            <Card>
              <h3 className="text-base font-semibold text-ink mb-4">Account Information</h3>
              <div className="space-y-4 max-w-2xl">
                <Input label="Full Name" value={form.userName} onChange={setField('userName')} />
                <Input label="Email" type="email" value={form.userEmail} onChange={setField('userEmail')} />
                <div>
                  <label className="label">Role</label>
                  <input className="input bg-surface-app" value="Administrator" disabled />
                </div>
                <Button onClick={() => toast.success('Account updated successfully')}>Save Changes</Button>
              </div>
            </Card>
          )}

          {active === 'users' && (
            <Card padding={false}>
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-base font-semibold text-ink">Users & Roles</h3>
                <Button size="sm" onClick={() => toast.info('User invitation will be available with backend integration')}>Invite User</Button>
              </div>
              <div className="divide-y divide-border">
                {roles.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-ink">{r.name}</p>
                      <p className="text-xs text-ink-muted">{r.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge bg-surface-app text-ink-secondary">{r.role}</span>
                      <span className="badge bg-success-bg text-success">{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {active === 'notifications' && (
            <Card>
              <h3 className="text-base font-semibold text-ink mb-4">Notification Preferences</h3>
              <div className="space-y-4 max-w-2xl">
                <ToggleRow label="Unpaid fee alerts" description="Get notified when students have unpaid fees" checked={form.notifyUnpaid} onChange={setField('notifyUnpaid')} />
                <ToggleRow label="Challan reminders" description="Alerts for unsent challans" checked={form.notifyChallans} onChange={setField('notifyChallans')} />
                <ToggleRow label="Payment verification" description="Alerts for pending payment verifications" checked={form.notifyPayments} onChange={setField('notifyPayments')} />
                <ToggleRow label="New admissions" description="Alerts when new students enroll" checked={form.notifyAdmissions} onChange={setField('notifyAdmissions')} />
                <Button onClick={() => toast.success('Notification preferences saved')}>Save Preferences</Button>
              </div>
            </Card>
          )}

          {active === 'fees' && (
            <Card>
              <h3 className="text-base font-semibold text-ink mb-4">Fee Settings</h3>
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Default Tuition Fee (PKR)" type="number" value={form.tuition} onChange={setField('tuition')} />
                  <Input label="Default Transport Fee (PKR)" type="number" value={form.transport} onChange={setField('transport')} />
                  <Input label="Due Date (day of month)" type="number" value={form.dueDate} onChange={setField('dueDate')} />
                  <Input label="Late Fee (PKR)" type="number" value={form.lateFee} onChange={setField('lateFee')} />
                </div>
                <Button onClick={handleSave}>Save Settings</Button>
              </div>
            </Card>
          )}

          {active === 'academic' && (
            <Card>
              <h3 className="text-base font-semibold text-ink mb-4">Academic Settings</h3>
              <div className="space-y-4 max-w-2xl">
                <Input label="Academic Session" value={form.session} onChange={setField('session')} />
                <Select label="Grading System">
                  <option>Percentage Based</option>
                  <option>Grade Point Average (GPA)</option>
                  <option>Letter Grades</option>
                </Select>
                <Select label="Academic Year Start Month">
                  <option>April</option>
                  <option>August</option>
                  <option>September</option>
                </Select>
                <Button onClick={() => toast.success('Academic settings saved')}>Save Settings</Button>
              </div>
            </Card>
          )}

          {active === 'appearance' && (
            <Card>
              <h3 className="text-base font-semibold text-ink mb-4">Appearance</h3>
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="label">Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 border-2 border-primary rounded-card text-left">
                      <div className="w-full h-12 bg-white border border-border rounded mb-2" />
                      <p className="text-sm font-medium text-ink">Light</p>
                    </button>
                    <button className="p-4 border-2 border-border rounded-card text-left opacity-50">
                      <div className="w-full h-12 bg-gray-800 rounded mb-2" />
                      <p className="text-sm font-medium text-ink">Dark (Coming Soon)</p>
                    </button>
                  </div>
                </div>
                <Select label="Primary Color">
                  <option>Green (Default)</option>
                  <option>Blue</option>
                  <option>Teal</option>
                </Select>
                <Button onClick={() => toast.success('Appearance settings saved')}>Save Settings</Button>
              </div>
            </Card>
          )}

          {active === 'security' && (
            <Card>
              <h3 className="text-base font-semibold text-ink mb-4">Security</h3>
              <div className="space-y-4 max-w-2xl">
                <ToggleRow label="Two-Factor Authentication" description="Add an extra layer of security to your account" checked={form.twoFactor} onChange={setField('twoFactor')} />
                <div className="pt-4 border-t border-border">
                  <Input label="Current Password" type="password" placeholder="Enter current password" />
                </div>
                <Input label="New Password" type="password" placeholder="Enter new password" />
                <Input label="Confirm New Password" type="password" placeholder="Re-enter new password" />
                <Button onClick={() => toast.success('Security settings updated')}>Update Security</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface-app rounded-btn">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-muted">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-border-strong'
        )}
        role="switch"
        aria-checked={checked}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
          checked && 'translate-x-5'
        )} />
      </button>
    </div>
  )
}
