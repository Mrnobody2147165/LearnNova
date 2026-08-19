import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Upload, Download, Eye, Pencil, Trash2, Users } from 'lucide-react'
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
import { downloadCSV, formatDate } from '../../../utils/format'

const emptyForm = { name: '', class: '', section: '', guardian: '', phone: '', email: '', address: '', gender: 'Male', dob: '', rollNo: '' }

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
      setStudents(data)
      setLoading(false)
    })
  }, [])

  const classOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  const sectionOptions = ['A', 'B', 'C']

  const filtered = students.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())
    const matchClass = classFilter === 'all' || s.class === classFilter
    const matchFee = feeFilter === 'all' || s.feeStatus === feeFilter
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchClass && matchFee && matchStatus
  })

  const validate = () => {
    const errs = {}
    if (!form.name) errs.name = 'Name is required'
    if (!form.class) errs.class = 'Class is required'
    if (!form.guardian) errs.guardian = 'Guardian name is required'
    if (!form.phone) errs.phone = 'Phone is required'
    if (form.email && !form.email.includes('@')) errs.email = 'Invalid email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const data = { ...form, class: form.class, section: form.section || 'A' }
    if (editId) {
      await studentService.update(editId, data)
      setStudents(prev => prev.map(s => s.id === editId ? { ...s, ...data } : s))
      toast.success('Student updated successfully')
    } else {
      const created = await studentService.create(data)
      setStudents(prev => [created, ...prev])
      toast.success('Student added successfully')
    }
    setModalOpen(false)
    setForm(emptyForm)
    setEditId(null)
    setErrors({})
  }

  const handleEdit = (student) => {
    setEditId(student.id)
    setForm({ name: student.name, class: student.class, section: student.section || '', guardian: student.guardian, phone: student.phone, email: student.email, address: student.address, gender: student.gender, dob: student.dob, rollNo: student.rollNo })
    setModalOpen(true)
  }

  const handleDelete = async () => {
    await studentService.remove(deleteId)
    setStudents(prev => prev.filter(s => s.id !== deleteId))
    toast.success('Student deleted successfully')
    setDeleteId(null)
  }

  const handleExport = () => {
    downloadCSV('students.csv', filtered.map(s => ({ ID: s.id, Name: s.name, Class: s.class, Guardian: s.guardian, Phone: s.phone, FeeStatus: s.feeStatus, Status: s.status })))
    toast.success('Students exported to CSV')
  }

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${students.length} students enrolled`}
        actions={
          <>
            <Button variant="secondary" onClick={() => toast.info('Import feature will be available with backend integration')}>
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={() => { setForm(emptyForm); setEditId(null); setModalOpen(true) }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Student</span>
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card className="mb-4" padding={false}>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or ID..." className="flex-1" />
          <div className="flex gap-3">
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
          <EmptyState icon={Users} title="No students found" description="Try changing your filters or add your first student." action={<Button onClick={() => { setForm(emptyForm); setEditId(null); setModalOpen(true) }}><Plus className="w-4 h-4" />Add Student</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Student</th>
                  <th className="table-header">Class</th>
                  <th className="table-header">Guardian</th>
                  <th className="table-header">Phone</th>
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
                        <div>
                          <p className="font-medium text-ink">{student.name}</p>
                          <p className="text-xs text-ink-muted">{student.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">{student.class}</td>
                    <td className="table-cell">{student.guardian}</td>
                    <td className="table-cell text-ink-secondary">{student.phone}</td>
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

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setErrors({}) }}
        title={editId ? 'Edit Student' : 'Add Student'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? 'Save Changes' : 'Add Student'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={form.name} onChange={setField('name')} error={errors.name} placeholder="e.g. Ahmed Khan" />
            <Input label="Roll No" value={form.rollNo} onChange={setField('rollNo')} placeholder="e.g. 25" />
            <Select label="Class" value={form.class} onChange={setField('class')} error={errors.class}>
              <option value="">Select class</option>
              {classOptions.map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
            </Select>
            <Select label="Section" value={form.section} onChange={setField('section')}>
              <option value="">Select section</option>
              {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Guardian Name" value={form.guardian} onChange={setField('guardian')} error={errors.guardian} placeholder="e.g. Imran Khan" />
            <Input label="Phone" value={form.phone} onChange={setField('phone')} error={errors.phone} placeholder="+92 300 1234567" />
            <Input label="Email" type="email" value={form.email} onChange={setField('email')} error={errors.email} placeholder="guardian@email.com" />
            <Select label="Gender" value={form.gender} onChange={setField('gender')}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <Input label="Date of Birth" type="date" value={form.dob} onChange={setField('dob')} />
            <Input label="Address" value={form.address} onChange={setField('address')} placeholder="House 24, Gulshan, Karachi" />
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
