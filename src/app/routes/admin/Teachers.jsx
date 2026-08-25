import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Mail, Phone, GraduationCap } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import SearchInput from '../../../components/ui/SearchInput'
import Avatar from '../../../components/ui/Avatar'
import StatusBadge from '../../../components/ui/StatusBadge'
import Modal from '../../../components/ui/Modal'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import EmptyState from '../../../components/ui/EmptyState'
import LoadingState from '../../../components/ui/LoadingState'
import { useToast } from '../../../components/ui/Toast'
import studentService from '../../../services/students'

const emptyForm = { name: '', email: '', phone: '', subjects: '', classes: '', qualification: '' }

export default function Teachers() {
  const toast = useToast()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    studentService.getTeachers().then(data => {
      setTeachers(data)
      setLoading(false)
    })
  }, [])

  const filtered = (teachers || []).filter(t => {
    const tName = String(t?.name || '').toLowerCase()
    const tEmail = String(t?.email || '').toLowerCase()
    const q = String(search || '').toLowerCase()

    return !q || tName.includes(q) || tEmail.includes(q)
  })

  const validate = () => {
    const errs = {}
    if (!form.name) errs.name = 'Name is required'
    if (!form.email) errs.email = 'Email is required'
    else if (!form.email.includes('@')) errs.email = 'Invalid email'
    if (!form.phone) errs.phone = 'Phone is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const data = {
      ...form,
      subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
      classes: form.classes.split(',').map(c => c.trim()).filter(Boolean),
    }
    if (editId) {
      await studentService.updateTeacher(editId, data)
      setTeachers(prev => prev.map(t => t.id === editId ? { ...t, ...data } : t))
      toast.success('Teacher updated successfully')
    } else {
      const created = await studentService.createTeacher(data)
      setTeachers(prev => [...prev, created])
      toast.success('Teacher added successfully')
    }
    setModalOpen(false)
    setForm(emptyForm)
    setEditId(null)
    setErrors({})
  }

  const handleEdit = (teacher) => {
    setEditId(teacher.id)
    setForm({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      subjects: teacher.subjects.join(', '),
      classes: teacher.classes.join(', '),
      qualification: teacher.qualification || '',
    })
    setModalOpen(true)
  }

  const handleDelete = async () => {
    await studentService.removeTeacher(deleteId)
    setTeachers(prev => prev.filter(t => t.id !== deleteId))
    toast.success('Teacher deleted successfully')
    setDeleteId(null)
  }

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div>
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teachers on staff`}
        actions={
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setModalOpen(true) }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Teacher</span>
          </Button>
        }
      />

      <Card className="mb-4" padding={false}>
        <div className="p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
        </div>
      </Card>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={GraduationCap} title="No teachers found" description="Try changing your search or add your first teacher." action={<Button onClick={() => { setForm(emptyForm); setEditId(null); setModalOpen(true) }}><Plus className="w-4 h-4" />Add Teacher</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(teacher => (
            <Card key={teacher.id}>
              <div className="flex items-start gap-3 mb-4">
                <Avatar name={teacher.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-ink truncate">{teacher.name}</h3>
                  <p className="text-xs text-ink-muted">{teacher.id}</p>
                  <div className="mt-1"><StatusBadge status={teacher.status} /></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{teacher.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{teacher.phone}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {teacher.subjects.map(s => (
                  <span key={s} className="badge bg-primary-light text-primary">{s}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {teacher.classes.map(c => (
                  <span key={c} className="badge bg-surface-app text-ink-secondary">{c}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleEdit(teacher)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(teacher.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-danger" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setErrors({}) }}
        title={editId ? 'Edit Teacher' : 'Add Teacher'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? 'Save Changes' : 'Add Teacher'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={form.name} onChange={setField('name')} error={errors.name} placeholder="e.g. Sadia Rahman" />
            <Input label="Email" type="email" value={form.email} onChange={setField('email')} error={errors.email} placeholder="teacher@school.edu.pk" />
            <Input label="Phone" value={form.phone} onChange={setField('phone')} error={errors.phone} placeholder="+92 300 1234567" />
            <Input label="Qualification" value={form.qualification} onChange={setField('qualification')} placeholder="e.g. MSc Mathematics" />
            <Input label="Subjects (comma-separated)" value={form.subjects} onChange={setField('subjects')} placeholder="Mathematics, Statistics" />
            <Input label="Classes (comma-separated)" value={form.classes} onChange={setField('classes')} placeholder="9-A, 9-B, 10-A" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  )
}
