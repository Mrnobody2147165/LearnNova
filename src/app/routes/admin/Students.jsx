import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Download, Eye, Pencil, Trash2, Users, MessageSquare } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import SearchInput from '../../../components/ui/SearchInput'
import StatusBadge from '../../../components/ui/StatusBadge'
import Avatar from '../../../components/ui/Avatar'
import Modal from '../../../components/ui/Modal'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import EmptyState from '../../../components/ui/EmptyState'
import LoadingState from '../../../components/ui/LoadingState'
import { useToast } from '../../../components/ui/Toast'
import studentService from '../../../services/students'
import whatsappService from '../../../services/whatsapp'
import { downloadCSV } from '../../../utils/format'

const emptyForm = {
  name: '',
  studentId: '',
  class: '',
  section: 'A',
  guardian: '',
  guardianPhone: '',
  phone: '',
  email: '',
  address: '',
  gender: 'Male',
  dob: '',
  admissionDate: '',
  rollNo: '',
}

export default function Students() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState(searchParams.get('class') || 'all')
  const [feeFilter, setFeeFilter] = useState(searchParams.get('feeStatus') || 'all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    studentService.getAll().then(data => {
      setStudents(data || [])
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const classOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  const sectionOptions = ['A', 'B', 'C']

  const filtered = (students || []).filter(s => {
    const sName = String(s?.name || '').toLowerCase()
    const sId = String(s?.id || '').toLowerCase()
    const sPhone = String(s?.phone || '').toLowerCase()
    const sClass = String(s?.class || '').toLowerCase()
    const q = String(search || '').toLowerCase()

    const matchSearch = !q || sName.includes(q) || sId.includes(q) || sPhone.includes(q)
    const matchClass = classFilter === 'all' || sClass.includes(classFilter.toLowerCase())
    const matchFee = feeFilter === 'all' || String(s?.feeStatus || '').toLowerCase() === feeFilter.toLowerCase()
    const matchStatus = statusFilter === 'all' || String(s?.status || '').toLowerCase() === statusFilter.toLowerCase()
    return matchSearch && matchClass && matchFee && matchStatus
  })

  const validate = () => {
    const errs = {}
    if (!form.name) errs.name = 'Name is required'
    if (!form.class) errs.class = 'Class is required'
    if (!form.phone) errs.phone = 'WhatsApp / Mobile number is required'
    if (form.email && !form.email.includes('@')) errs.email = 'Invalid email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const data = {
      ...form,
      class: form.class,
      section: form.section || 'A',
      feeStatus: form.feeStatus || 'Pending',
      status: form.status || 'Active',
      phone: form.phone,
      guardianPhone: form.guardianPhone || form.phone,
    }

    try {
      if (editId) {
        await studentService.update(editId, data)
        setStudents(prev => prev.map(s => s.id === editId ? { ...s, ...data } : s))
        toast.success('Student & WhatsApp number updated successfully')
      } else {
        const created = await studentService.create(data)
        setStudents(prev => [created, ...prev])
        toast.success('Student enrolled with WhatsApp notification capability')
      }
      setModalOpen(false)
      setForm(emptyForm)
      setEditId(null)
      setErrors({})
    } catch (err) {
      toast.error('Failed to save student record')
    }
  }

  const handleEdit = (student) => {
    setEditId(student.id)
    setForm({
      name: student.name || '',
      studentId: student.id || '',
      class: student.class?.replace(/[^0-9]/g, '') || '',
      section: student.section || 'A',
      guardian: student.guardian || '',
      guardianPhone: student.guardianPhone || student.phone || '',
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      gender: student.gender || 'Male',
      dob: student.dob || '',
      admissionDate: student.admissionDate || '',
      rollNo: student.rollNo || '',
      feeStatus: student.feeStatus || 'Pending',
      status: student.status || 'Active',
    })
    setModalOpen(true)
  }

  const handleDelete = async () => {
    await studentService.remove(deleteId)
    setStudents(prev => prev.filter(s => s.id !== deleteId))
    toast.success('Student deleted successfully')
    setDeleteId(null)
  }

  const handleExport = () => {
    downloadCSV('students.csv', filtered.map(s => ({
      ID: s.id,
      Name: s.name,
      Class: s.class,
      WhatsApp: s.phone,
      Guardian: s.guardian,
      FeeStatus: s.feeStatus,
      Status: s.status,
    })))
    toast.success('Students exported to CSV')
  }

  const handleQuickWhatsApp = (student) => {
    const phone = whatsappService.formatWhatsAppNumber(student.phone || '03001234567')
    const msg = `Hello ${student.name}'s Guardian,\nThis is an official communication from Learnify Model Grammar School regarding academic and fee records for Class ${student.class}.`
    whatsappService.openWhatsAppDirect(phone, msg)
  }

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div>
      <PageHeader
        title="Students Directory"
        subtitle={`${students.length} students enrolled with verified contact numbers`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={() => { setForm(emptyForm); setEditId(null); setModalOpen(true) }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Student</span>
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-4" padding={false}>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, ID, or WhatsApp number..." className="flex-1" />
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-auto min-w-[120px]">
              <option value="all">All Classes</option>
              {classOptions.map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
            </Select>
            <Select value={feeFilter} onChange={(e) => setFeeFilter(e.target.value)} className="w-auto min-w-[120px]">
              <option value="all">All Fee Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto min-w-[120px]">
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            description="Add your first student with their parent's WhatsApp number to start generating automated fee challans."
            action={<Button onClick={() => { setForm(emptyForm); setEditId(null); setModalOpen(true) }}><Plus className="w-4 h-4" />Add Student</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-border bg-surface-app">
                  <th className="table-header">Student</th>
                  <th className="table-header">Student ID</th>
                  <th className="table-header">Class & Sec</th>
                  <th className="table-header">WhatsApp / Contact</th>
                  <th className="table-header">Guardian</th>
                  <th className="table-header">Fee Status</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(student => (
                  <tr key={student.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={student.name} size="sm" />
                        <p className="font-medium text-ink">{student.name}</p>
                      </div>
                    </td>
                    <td className="table-cell text-xs font-mono text-primary font-semibold">{student.id}</td>
                    <td className="table-cell font-medium">{student.class}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-ink-secondary">{student.phone || 'Not set'}</span>
                        {student.phone && (
                          <button
                            type="button"
                            onClick={() => handleQuickWhatsApp(student)}
                            title="Direct WhatsApp Chat"
                            className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-sm text-ink-secondary">{student.guardian || '—'}</td>
                    <td className="table-cell"><StatusBadge status={student.feeStatus} /></td>
                    <td className="table-cell"><StatusBadge status={student.status} /></td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/students/${student.id}`)} className="p-1.5 rounded-btn text-ink-muted hover:bg-primary-light hover:text-primary transition-colors" aria-label="View student">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(student)} className="p-1.5 rounded-btn text-ink-muted hover:bg-surface-hover hover:text-ink transition-colors" aria-label="Edit student">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(student.id)} className="p-1.5 rounded-btn text-ink-muted hover:bg-danger-bg hover:text-danger transition-colors" aria-label="Delete student">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal with Proactive WhatsApp Field */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setErrors({}) }}
        title={editId ? 'Edit Student Details' : 'Enroll New Student'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? 'Save Changes' : 'Enroll Student'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-btn flex items-center gap-2 text-xs text-emerald-800">
            <MessageSquare className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>Monthly fee challans and payment receipts will be automatically dispatched to the entered WhatsApp number.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name *" value={form.name} onChange={setField('name')} error={errors.name} placeholder="e.g. Ahmed Khan" />
            <Input label="Student ID" value={form.studentId} onChange={setField('studentId')} placeholder="Auto-generated if empty (e.g. STU-2026-00150)" />
            <Select label="Class *" value={form.class} onChange={setField('class')} error={errors.class}>
              <option value="">Select class</option>
              {classOptions.map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
            </Select>
            <Select label="Section" value={form.section} onChange={setField('section')}>
              {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input
              label="Parent / WhatsApp Number *"
              value={form.phone}
              onChange={setField('phone')}
              error={errors.phone}
              placeholder="e.g. 03001234567 or +923001234567"
            />
            <Input label="Guardian Name" value={form.guardian} onChange={setField('guardian')} placeholder="e.g. Muhammad Khan" />
            <Input label="Guardian Secondary Phone" value={form.guardianPhone} onChange={setField('guardianPhone')} placeholder="Optional secondary contact" />
            <Input label="Email Address" type="email" value={form.email} onChange={setField('email')} error={errors.email} placeholder="parent@gmail.com" />
            <Input label="Date of Birth" type="date" value={form.dob} onChange={setField('dob')} />
            <Input label="Admission Date" type="date" value={form.admissionDate} onChange={setField('admissionDate')} />
            <Select label="Gender" value={form.gender} onChange={setField('gender')}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <Input label="Residential Address" value={form.address} onChange={setField('address')} placeholder="House 24, Street 5, Karachi" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  )
}
