import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Calendar, Clock, Award, Upload } from 'lucide-react'
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
import examService from '../../../services/exams'
import subjectService from '../../../services/subjects'
import { formatDate } from '../../../utils/format'

export default function Exams() {
  const toast = useToast()
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editExam, setEditExam] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [publishId, setPublishId] = useState(null)
  const [form, setForm] = useState({ name: '', class: '', section: 'A', subject: '', subjectId: '', date: '', startTime: '10:00', totalMarks: 100, description: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [examData, subjData] = await Promise.all([examService.getExams(), subjectService.getAll()])
    setExams(examData || [])
    setSubjects(subjData || [])
    setLoading(false)
  }

  const filtered = (exams || []).filter(e => {
    const eName = String(e?.name || '').toLowerCase()
    const eSub = String(e?.subject || '').toLowerCase()
    const eClass = String(e?.class || '').toLowerCase()
    const q = String(search || '').toLowerCase()

    return !q || eName.includes(q) || eSub.includes(q) || eClass.includes(q)
  })

  const openAdd = () => {
    setEditExam(null)
    setForm({ name: '', class: '', section: 'A', subject: '', subjectId: '', date: '', startTime: '10:00', totalMarks: 100, description: '' })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (exam) => {
    setEditExam(exam)
    setForm({ name: exam.name, class: exam.class, section: exam.section, subject: exam.subject, subjectId: exam.subjectId, date: exam.date, startTime: exam.startTime, totalMarks: exam.totalMarks, description: exam.description })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name) errs.name = 'Exam name is required'
    if (!form.class) errs.class = 'Class is required'
    if (!form.subject) errs.subject = 'Subject is required'
    if (!form.date) errs.date = 'Date is required'
    if (!form.totalMarks || form.totalMarks < 1) errs.totalMarks = 'Valid marks required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      if (editExam) {
        await examService.update(editExam.id, form)
        toast.success('Exam updated successfully.')
      } else {
        await examService.create(form)
        toast.success('Exam created successfully.')
      }
      setModalOpen(false)
      loadData()
    } catch {
      toast.error('Failed to save exam')
    }
  }

  const handleDelete = async () => {
    try {
      await examService.remove(deleteId)
      toast.success('Exam deleted.')
      loadData()
    } catch {
      toast.error('Failed to delete exam')
    }
    setDeleteId(null)
  }

  const handlePublish = async () => {
    try {
      await examService.publishResults(publishId)
      toast.success('Results published. Students can now view their results.')
      loadData()
    } catch {
      toast.error('Failed to publish results')
    }
    setPublishId(null)
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle="Create and manage examinations"
        actions={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Create Exam</Button>}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exams..." className="input pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No exams found" description="Create your first exam to get started" action={<Button onClick={openAdd}><Plus className="w-4 h-4" /> Create Exam</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(exam => (
            <Card key={exam.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  {exam.status === 'Completed' && !exam.resultsPublished && (
                    <Button variant="ghost" size="sm" onClick={() => setPublishId(exam.id)}>
                      <Upload className="w-3.5 h-3.5" /> Publish
                    </Button>
                  )}
                  <button onClick={() => openEdit(exam)} className="p-1.5 rounded-btn hover:bg-surface-hover text-ink-muted hover:text-ink" aria-label="Edit exam">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(exam.id)} className="p-1.5 rounded-btn hover:bg-danger-bg text-ink-muted hover:text-danger" aria-label="Delete exam">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-base font-semibold text-ink">{exam.subject}</h3>
              <p className="text-sm text-ink-secondary mb-3">{exam.name}</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-ink-secondary">
                  <Calendar className="w-3.5 h-3.5 text-ink-muted" /> {formatDate(exam.date)}
                </div>
                <div className="flex items-center gap-2 text-ink-secondary">
                  <Clock className="w-3.5 h-3.5 text-ink-muted" /> {exam.startTime} • {exam.totalMarks} marks
                </div>
                <p className="text-ink-muted text-xs">Class {exam.class}-{exam.section}</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge status={exam.status === 'Completed' ? 'Completed' : 'Pending'} />
                {exam.resultsPublished && <StatusBadge status="Active" />}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editExam ? 'Edit Exam' : 'Create Exam'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editExam ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Exam Name" placeholder="e.g. August Monthly Examination" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Class" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} error={errors.class}>
              <option value="">Select class</option>
              {['6','7','8','9','10'].map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
            </Select>
            <Select label="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
              {['A','B','C'].map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <Select label="Subject" value={form.subject} onChange={(e) => {
            const subj = subjects.find(s => s.name === e.target.value)
            setForm({ ...form, subject: e.target.value, subjectId: subj?.id || '' })
          }} error={errors.subject}>
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} error={errors.date} />
            <Input label="Start Time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </div>
          <Input label="Total Marks" type="number" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: parseInt(e.target.value) || 0 })} error={errors.totalMarks} />
          <Input label="Description" placeholder="e.g. Chapter 1–5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Exam"
        message="Are you sure you want to delete this exam?"
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={!!publishId}
        onClose={() => setPublishId(null)}
        onConfirm={handlePublish}
        title="Publish Results"
        message="Once published, results will be visible to students in their portal. Continue?"
        confirmLabel="Publish"
        danger={false}
      />
    </div>
  )
}
