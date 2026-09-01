import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, School, FileText, Users, User, BookOpen, Search } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Modal from '../../../components/ui/Modal'
import EmptyState from '../../../components/ui/EmptyState'
import LoadingState from '../../../components/ui/LoadingState'
import { useToast } from '../../../components/ui/Toast'
import classService from '../../../services/classes'
import { generateClassPDF } from '../../../services/pdfGenerator'

const emptyForm = {
  name: '',
  sections: ['A', 'B'],
  teacher: '',
  subjects: [],
  capacity: 0,
  academicYear: '2025-2026',
}

export default function Classes() {
  const toast = useToast()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [availableTeachers, setAvailableTeachers] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await classService.getAll()
      setClasses(data || [])
      setAvailableTeachers(classService.getTeachers())
      setAvailableSubjects(classService.getSubjects())
    } catch (err) {
      console.warn('Classes fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = classes.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacher?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (cls) => {
    setEditId(cls.id)
    setForm({
      name: cls.name || '',
      sections: cls.sections || ['A', 'B'],
      teacher: cls.teacher || '',
      subjects: cls.subjects || [],
      capacity: cls.capacity || 0,
      academicYear: cls.academicYear || '2025-2026',
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleSave = async () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Class name is required'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      if (editId) {
        await classService.update(editId, form)
        toast.success('Class updated successfully.')
      } else {
        await classService.create(form)
        toast.success('Class created successfully.')
      }
      setModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to save class')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return
    try {
      await classService.delete(id)
      toast.success('Class deleted.')
      fetchData()
    } catch (err) {
      toast.error('Failed to delete class')
    }
  }

  const handleGeneratePDF = (cls) => {
    try {
      // Pass the CURRENT class data directly — no stale lookups
      generateClassPDF(cls)
      toast.success('PDF generated successfully.')
    } catch (err) {
      toast.error('Failed to generate PDF')
    }
  }

  const toggleSubject = (subject) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }))
  }

  const toggleSection = (section) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section],
    }))
  }

  if (loading) return <div className="p-6"><LoadingState /></div>

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Classes"
        subtitle={`${classes.length} classes configured`}
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search classes..."
          className="input pl-9 pr-4 py-2 text-sm w-full"
        />
      </div>

      {/* Classes Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={School}
          title="No classes found"
          description="Create your first class to get started."
          action={<Button onClick={openCreate}>Add Class</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(cls => (
            <Card key={cls.id} className="p-5 hover:shadow-card transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                    <School className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{cls.name}</h3>
                    <p className="text-xs text-ink-muted">Sections: {cls.sections?.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(cls)} className="p-1.5 rounded-btn hover:bg-surface-hover text-ink-muted hover:text-ink" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleGeneratePDF(cls)} className="p-1.5 rounded-btn hover:bg-surface-hover text-ink-muted hover:text-ink" title="Generate PDF">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cls.id)} className="p-1.5 rounded-btn hover:bg-danger-light text-ink-muted hover:text-danger" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-ink-secondary">
                  <User className="w-4 h-4 text-ink-muted" />
                  <span>Teacher: <span className="text-ink font-medium">{cls.teacher || 'Not assigned'}</span></span>
                </div>
                <div className="flex items-center gap-2 text-ink-secondary">
                  <Users className="w-4 h-4 text-ink-muted" />
                  <span>Students: <span className="text-ink font-medium">{cls.studentCount || 0}</span> / {cls.capacity || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-ink-secondary">
                  <BookOpen className="w-4 h-4 text-ink-muted" />
                  <span className="truncate">
                    {cls.subjects?.length > 0 ? cls.subjects.join(', ') : 'No subjects'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border text-xs text-ink-muted">
                Academic Year: {cls.academicYear || '2025-2026'}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Class' : 'Add New Class'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update Class' : 'Create Class'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Class Name"
            placeholder="e.g. Class 8"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />

          {/* Sections */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Sections</label>
            <div className="flex flex-wrap gap-2">
              {['A', 'B', 'C', 'D', 'E'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSection(s)}
                  className={`px-3 py-1.5 rounded-btn text-sm font-medium border transition-colors ${
                    form.sections.includes(s)
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border text-ink-secondary hover:bg-surface-hover'
                  }`}
                >
                  Section {s}
                </button>
              ))}
            </div>
          </div>

          <Select
            label="Class Teacher"
            value={form.teacher}
            onChange={(e) => setForm({ ...form, teacher: e.target.value })}
          >
            <option value="">Select teacher...</option>
            {availableTeachers.map(t => (
              <option key={t.id} value={t.name}>{t.name} ({t.subjects?.join(', ')})</option>
            ))}
          </Select>

          {/* Subjects */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Subjects</label>
            <div className="flex flex-wrap gap-2">
              {availableSubjects.map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => toggleSubject(sub)}
                  className={`px-2.5 py-1 rounded-btn text-xs font-medium border transition-colors ${
                    form.subjects.includes(sub)
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border text-ink-secondary hover:bg-surface-hover'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacity"
              type="number"
              placeholder="e.g. 200"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Academic Year"
              placeholder="e.g. 2025-2026"
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
