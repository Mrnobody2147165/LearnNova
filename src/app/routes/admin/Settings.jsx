import { useState, useEffect } from 'react'
import { School, User, Users, MessageSquare, Wallet, BookOpen, Palette, Shield, Send, Sparkles } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import { useToast } from '../../../components/ui/Toast'
import { useSchoolStore } from '../../../stores/schoolStore'
import { useAuthStore } from '../../../stores/authStore'
import { getWhatsAppConfig, saveWhatsAppConfig } from '../../../services/whatsapp'
import { getAutoBillingConfig, saveAutoBillingConfig } from '../../../services/billingAutomation'
import { cn } from '../../../utils/format'

const sections = [
  { id: 'profile', label: 'School Profile', icon: School },
  { id: 'whatsapp', label: 'WhatsApp API Gateway', icon: MessageSquare },
  { id: 'fees', label: 'Fee Settings', icon: Wallet },
  { id: 'account', label: 'Account', icon: User },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'academic', label: 'Academic Settings', icon: BookOpen },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function Settings() {
  const toast = useToast()
  const { school, updateSchool } = useSchoolStore()
  const { user } = useAuthStore()
  const [active, setActive] = useState('whatsapp')
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
    whatsappGateway: 'direct', // 'direct', 'meta', 'ultramsg', 'custom'
    whatsappApiKey: '',
    whatsappInstanceId: '',
    whatsappSenderPhone: '+92 300 1234567',
    whatsappApiUrl: '',
    autoBillingEnabled: true,
    autoBillingDay: 1,
    autoDispatchChallans: true,
    autoDispatchReceipts: true,
    autoDispatchAdmissions: true,
    twoFactor: false,
  })

  useEffect(() => {
    const config = getWhatsAppConfig()
    const autoConfig = getAutoBillingConfig()
    setForm(prev => ({
      ...prev,
      whatsappGateway: config.provider || 'direct',
      whatsappApiKey: config.apiToken || '',
      whatsappInstanceId: config.instanceId || '',
      whatsappApiUrl: config.apiUrl || '',
      whatsappSenderPhone: config.senderPhone || prev.whatsappSenderPhone,
      autoBillingEnabled: autoConfig.enabled ?? true,
      autoBillingDay: autoConfig.dispatchDayOfMonth || 1,
    }))
  }, [])

  const setField = (field) => (e) => {
    const value = typeof e.target.checked !== 'undefined' && e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveSchool = () => {
    updateSchool({
      name: form.name,
      address: form.address,
      phone: form.phone,
      email: form.email,
      session: form.session,
      fees: { tuition: Number(form.tuition), transport: Number(form.transport), dueDate: Number(form.dueDate), lateFee: Number(form.lateFee) },
    })
    toast.success('School profile saved successfully')
  }

  const handleSaveWhatsApp = () => {
    saveWhatsAppConfig({
      provider: form.whatsappGateway,
      apiToken: form.whatsappApiKey,
      instanceId: form.whatsappInstanceId,
      apiUrl: form.whatsappApiUrl,
      senderPhone: form.whatsappSenderPhone,
    })
    saveAutoBillingConfig({
      enabled: form.autoBillingEnabled,
      dispatchDayOfMonth: Number(form.autoBillingDay),
      autoGenerate: true,
      autoWhatsAppBroadcast: form.autoDispatchChallans,
    })
    toast.success('WhatsApp API gateway & auto-billing rules saved successfully')
  }

  const handleTestWhatsApp = () => {
    handleSaveWhatsApp()
    const url = `https://api.whatsapp.com/send?phone=${form.whatsappSenderPhone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent('Hello! This is an official test notification from LearnNova Model Grammar School WhatsApp billing gateway.')}`
    window.open(url, '_blank')
    toast.success('Test WhatsApp message launched')
  }

  const roles = [
    { id: 'R1', name: 'Admin User', email: user?.email || 'admin@learnnova.edu.pk', role: 'Administrator', status: 'Active' },
    { id: 'R2', name: 'Sadia Rahman', email: 'sadia.r@learnnova.edu.pk', role: 'Faculty', status: 'Active' },
    { id: 'R3', name: 'Kamran Akhtar', email: 'kamran.a@learnnova.edu.pk', role: 'Faculty', status: 'Active' },
    { id: 'R4', name: 'Accounts Manager', email: 'accounts@learnnova.edu.pk', role: 'Accountant', status: 'Active' },
  ]

  return (
    <div>
      <PageHeader title="Settings & Integrations" subtitle="Manage your school, fee structures, and automated WhatsApp API gateway" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-60 flex-shrink-0">
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
          {/* WhatsApp Integration Section */}
          {active === 'whatsapp' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    Automated WhatsApp API & Gateway Settings
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Configure automated monthly challan dispatch and instant parent voucher notifications
                  </p>
                </div>
                <span className="badge bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  {form.whatsappGateway === 'direct' ? 'Direct 1-Click Active' : 'API Configured'}
                </span>
              </div>

              <div className="space-y-4 max-w-2xl">
                {/* Automated Billing Engine Banner */}
                <div className="p-3.5 bg-emerald-50 rounded-card border border-emerald-200 text-xs text-emerald-950 leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Automated Scheduled Monthly Billing
                  </div>
                  <p>
                    When the scheduled billing date arrives each month, the system will automatically calculate fee challans for all enrolled students and queue them for automated WhatsApp broadcast without requiring manual clicks.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="font-semibold text-emerald-900">Auto-Generate & Send on Day:</label>
                    <select
                      value={form.autoBillingDay}
                      onChange={(e) => setForm(prev => ({ ...prev, autoBillingDay: Number(e.target.value) }))}
                      className="input text-xs py-1 px-2.5 w-auto bg-white border border-emerald-300"
                    >
                      {[1, 2, 3, 4, 5, 10, 15, 20].map(d => (
                        <option key={d} value={d}>{`${d}${d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of every month`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Select label="WhatsApp Dispatch Mode" value={form.whatsappGateway} onChange={setField('whatsappGateway')}>
                  <option value="direct">Direct WhatsApp Web Gateway (Instant / No External API Key required)</option>
                  <option value="ultramsg">UltraMsg Automated WhatsApp Gateway (api.ultramsg.com)</option>
                  <option value="meta">Meta Official WhatsApp Cloud API (graph.facebook.com)</option>
                  <option value="custom">Custom Webhook Gateway Endpoint (Node.js / Python)</option>
                </Select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="School WhatsApp Sender Number" value={form.whatsappSenderPhone} onChange={setField('whatsappSenderPhone')} placeholder="+92 300 1234567" />
                  {form.whatsappGateway === 'ultramsg' && (
                    <Input label="UltraMsg Instance ID" value={form.whatsappInstanceId} onChange={setField('whatsappInstanceId')} placeholder="instance12345" />
                  )}
                  {form.whatsappGateway === 'meta' && (
                    <Input label="Meta Phone Number ID" value={form.whatsappInstanceId} onChange={setField('whatsappInstanceId')} placeholder="1029384756..." />
                  )}
                </div>

                {form.whatsappGateway === 'custom' && (
                  <Input label="Custom Webhook URL" value={form.whatsappApiUrl} onChange={setField('whatsappApiUrl')} placeholder="https://api.yourdomain.com/send-whatsapp" />
                )}

                {form.whatsappGateway !== 'direct' && (
                  <Input label="API Secret Token / Bearer Key" type="password" value={form.whatsappApiKey} onChange={setField('whatsappApiKey')} placeholder="Enter API secret token or key..." />
                )}

                <div className="pt-2 border-t border-border space-y-3">
                  <p className="text-sm font-semibold text-ink">Automation Triggers</p>
                  <ToggleRow
                    label="Enable Automated Monthly Billing Engine"
                    description="Automatically trigger challan generation and parent broadcasts on scheduled billing date"
                    checked={form.autoBillingEnabled}
                    onChange={setField('autoBillingEnabled')}
                  />
                  <ToggleRow
                    label="Send Instant WhatsApp Receipt on Payment"
                    description="Auto-dispatch confirmation receipt and PDF link when a fee payment is recorded"
                    checked={form.autoDispatchReceipts}
                    onChange={setField('autoDispatchReceipts')}
                  />
                  <ToggleRow
                    label="Welcome WhatsApp Message on Admission"
                    description="Send student ID and portal access link to parent WhatsApp upon enrolment"
                    checked={form.autoDispatchAdmissions}
                    onChange={setField('autoDispatchAdmissions')}
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <Button onClick={handleSaveWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Save Gateway & Automation Rules
                  </Button>
                  <Button variant="secondary" onClick={handleTestWhatsApp}>
                    <Send className="w-4 h-4 mr-1.5" />
                    Test WhatsApp Dispatch
                  </Button>
                </div>
              </div>
            </Card>
          )}

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
                <Button onClick={handleSaveSchool}>Save Changes</Button>
              </div>
            </Card>
          )}

          {active === 'fees' && (
            <Card>
              <h3 className="text-base font-semibold text-ink mb-4">Fee Policy & Billing Defaults</h3>
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Default Tuition Fee (PKR)" type="number" value={form.tuition} onChange={setField('tuition')} />
                  <Input label="Default Transport Fee (PKR)" type="number" value={form.transport} onChange={setField('transport')} />
                  <Input label="Challan Due Date (Day of Month)" type="number" value={form.dueDate} onChange={setField('dueDate')} />
                  <Input label="Late Payment Fee (PKR)" type="number" value={form.lateFee} onChange={setField('lateFee')} />
                </div>
                <Button onClick={handleSaveSchool}>Save Fee Settings</Button>
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
                <Button size="sm" onClick={() => toast.info('User invitation feature active')}>Invite Staff Member</Button>
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

          {active === 'academic' && (
            <Card>
              <h3 className="text-base font-semibold text-ink mb-4">Academic Settings</h3>
              <div className="space-y-4 max-w-2xl">
                <Input label="Academic Session" value={form.session} onChange={setField('session')} />
                <Select label="Academic Year Start Month">
                  <option>August</option>
                  <option>April</option>
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
                      <p className="text-sm font-medium text-ink">Light (Active)</p>
                    </button>
                    <button className="p-4 border-2 border-border rounded-card text-left opacity-50">
                      <div className="w-full h-12 bg-gray-800 rounded mb-2" />
                      <p className="text-sm font-medium text-ink">Dark (Coming Soon)</p>
                    </button>
                  </div>
                </div>
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
          checked ? 'bg-emerald-600' : 'bg-border-strong'
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
