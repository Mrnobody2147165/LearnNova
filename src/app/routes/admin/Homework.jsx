import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, ClipboardList, Calendar } from 'lucide-react'
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
import homeworkService from '../../../services/homework'
import subjectService from '../../../services/subjects'
import { formatDate } from '../../../utils/format'

export default function Homework() {
  const toast = useToast()
  const [homeworkList, setHomeworkList] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editHw, setEditHw] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ title: '', subject: '', subjectId: '', class: '', section: 'A', description: '', dueDate: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [hwData, subjData] = await Promise.all([homeworkService.getAll(), subjectService.getAll()])
    setHomeworkList(hwData)
    setSubjects(subjData)
    setLoading(false)
  }

  const filtered = homeworkList.filter(h =>
    h.title.toLowerCase().includes(search.toLowerCase()) ||
    h.subject.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditHw(null)
    setForm({ title: '', subject: '', subjectId: '', class: '', section: 'A', description: '', dueDate: '' })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (hw) => {
    setEditHw(hw)
    setForm({ title: hw.title, subject: hw.subject, subjectId: hw.subjectId, class: hw.class, section: hw.section, description: hw.description, dueDate: hw.dueDate })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.title) errs.title = 'Title is required'
    if (!form.subject) errs.subject = 'Subject is required'
    if (!form.class) errs.class = 'Class is required'
    if (!form.description) errs.description = 'Description is required'
    if (!form.dueDate) errs.dueDate = 'Due date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      if (editHw) {
        await homeworkService.update(editHw.id, form)
        toast.success('Homework updated successfully.')
      } else {
        await homeworkService.create(form)
        toast.success('Homework created successfully.')
      }
      setModalOpen(false)
      loadData()
    } catch {
      toast.error('Failed to save homework')
    }
  }

  const handleDelete = async () => {
    try {
      await homeworkService.remove(deleteId)
      toast.success('Homework deleted.')
      loadData()
    } catch {
      toast.error('Failed to delete homework')
    }
    setDeleteId(null)
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Homework Management"
        subtitle="Create and manage homework assignments"
        actions={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Create Homework</Button>}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search homework..." className="input pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No homework found" description="Create your first homework assignment" action={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Create Homework</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(hw => (
            <Card key={hw.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(hw)} className="p-1.5 rounded-btn hover:bg-surface-hover text-ink-muted hover:text-ink" aria-label="Edit homework">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(hw.id)} className="p-1.5 rounded-btn hover:bg-danger-bg text-ink-muted hover:text-danger" aria-label="Delete homework">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-semibold text-ink">{hw.title}</h3>
              <p className="text-sm text-ink-secondary">{hw.subject}</p>
              <p className="text-xs text-ink-muted mt-2">{hw.teacher}</p>
              <p className="text-sm text-ink-secondary mt-2 line-clamp-2">{hw.description}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <Calendar className="w-3.5 h-3.5" /> Due {formatDate(hw.dueDate)}
                </div>
                <StatusBadge status={hw.status === 'Active' ? 'Active' : 'Inactive'} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editHw ? 'Edit Homework' : 'Create Homework'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editHw ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" placeholder="e.g. Chapter 5 Exercises" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Subject" value={form.subject} onChange={(e) => {
              const subj = subjects.find(s => s.name === e.target.value)
              setForm({ ...form, subject: e.target.value, subjectId: subj?.id || '' })
            }} error={errors.subject}>
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </Select>
            <Select label="Class" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} error={errors.class}>
              <option value="">Select class</option>
              {['6','7','8','9','10'].map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
            </Select>
          </div>
          <Select label="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
            {['A','B','C'].map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Complete questions 1–10"
              rows={4}
              className={`input resize-none ${errors.description ? 'border-danger' : ''}`}
            />
            {errors.description && <p className="mt-1 text-xs text-danger">{errors.description}</p>}
          </div>
          <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} error={errors.dueDate} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Homework"
        message="Are you sure you want to delete this homework assignment?"
        confirmLabel="Delete"
      />
    </div>
  )
}
