import { useState, useEffect } from 'react'
import { Plus, BookOpen, Edit, Trash2, Search } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import StatusBadge from '../../../components/ui/StatusBadge'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import { useToast } from '../../../components/ui/Toast'
import subjectService from '../../../services/subjects'
import { teachers, classes } from '../../../data/students'

export default function Subjects() {
  const toast = useToast()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editSubject, setEditSubject] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', teacher: '', teacherId: '', classes: [] })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    setLoading(true)
    const data = await subjectService.getAll()
    setSubjects(data)
    setLoading(false)
  }

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditSubject(null)
    setForm({ name: '', code: '', teacher: '', teacherId: '', classes: [] })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (subject) => {
    setEditSubject(subject)
    setForm({ name: subject.name, code: subject.code, teacher: subject.teacher, teacherId: subject.teacherId, classes: subject.classes })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name) errs.name = 'Subject name is required'
    if (!form.code) errs.code = 'Subject code is required'
    if (!form.teacher) errs.teacher = 'Teacher is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      if (editSubject) {
        await subjectService.update(editSubject.id, form)
        toast.success('Subject updated successfully.')
      } else {
        await subjectService.create(form)
        toast.success('Subject created successfully.')
      }
      setModalOpen(false)
      loadSubjects()
    } catch {
      toast.error('Failed to save subject')
    }
  }

  const handleDelete = async () => {
    try {
      await subjectService.remove(deleteId)
      toast.success('Subject deleted.')
      loadSubjects()
    } catch {
      toast.error('Failed to delete subject')
    }
    setDeleteId(null)
  }

  const toggleClass = (className) => {
    const classId = `${className}`
    setForm(prev => ({
      ...prev,
      classes: prev.classes.includes(classId)
        ? prev.classes.filter(c => c !== classId)
        : [...prev.classes, classId]
    }))
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle="Manage subjects and assign teachers"
        actions={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Subject</Button>}
      />

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects..."
          className="input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects found" description="Create your first subject to get started" action={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Subject</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(subject => (
            <Card key={subject.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(subject)} className="p-1.5 rounded-btn hover:bg-surface-hover text-ink-muted hover:text-ink" aria-label="Edit subject">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(subject.id)} className="p-1.5 rounded-btn hover:bg-danger-bg text-ink-muted hover:text-danger" aria-label="Delete subject">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-semibold text-ink">{subject.name}</h3>
              <p className="text-xs text-ink-muted mb-3">{subject.code}</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Teacher</span>
                  <span className="font-medium text-ink">{subject.teacher}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Classes</span>
                  <span className="font-medium text-ink">{subject.classes.length}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {subject.classes.slice(0, 4).map(c => (
                  <span key={c} className="text-xs bg-surface-app text-ink-secondary px-2 py-0.5 rounded-full">{c}</span>
                ))}
                {subject.classes.length > 4 && <span className="text-xs text-ink-muted">+{subject.classes.length - 4} more</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSubject ? 'Edit Subject' : 'Add Subject'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editSubject ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Subject Name" placeholder="e.g. Mathematics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Input label="Subject Code" placeholder="e.g. MATH-101" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} error={errors.code} />
          <Select label="Teacher" value={form.teacher} onChange={(e) => {
            const teacher = teachers.find(t => t.name === e.target.value)
            setForm({ ...form, teacher: e.target.value, teacherId: teacher?.id || '' })
          }} error={errors.teacher}>
            <option value="">Select teacher</option>
            {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </Select>
          <div>
            <label className="label">Assign to Classes</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {classes.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleClass(c.name.replace('Class ', '') + '-A')}
                  className={`px-3 py-1.5 rounded-btn text-sm border transition-colors ${
                    form.classes.includes(c.name.replace('Class ', '') + '-A')
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border text-ink-secondary hover:border-primary'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  )
}
