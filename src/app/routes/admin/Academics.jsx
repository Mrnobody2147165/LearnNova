import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen, FileCheck, ClipboardList, Award } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Tabs from '../../../components/ui/Tabs'
import Modal from '../../../components/ui/Modal'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import EmptyState from '../../../components/ui/EmptyState'
import StatusBadge from '../../../components/ui/StatusBadge'
import { useToast } from '../../../components/ui/Toast'
import { formatDate } from '../../../utils/format'

const mockSubjects = [
  { id: 'SUB-1', name: 'Mathematics', code: 'MATH-101', classes: ['6', '7', '8', '9', '10'], teacher: 'Sadia Rahman' },
  { id: 'SUB-2', name: 'English', code: 'ENG-101', classes: ['6', '7', '8', '9', '10'], teacher: 'Nadia Shirazi' },
  { id: 'SUB-3', name: 'Physics', code: 'PHY-101', classes: ['8', '9', '10'], teacher: 'Kamran Akhtar' },
  { id: 'SUB-4', name: 'Chemistry', code: 'CHM-101', classes: ['8', '9', '10'], teacher: 'Amna Khalid' },
  { id: 'SUB-5', name: 'Biology', code: 'BIO-101', classes: ['9', '10'], teacher: 'Amna Khalid' },
  { id: 'SUB-6', name: 'Computer Science', code: 'CS-101', classes: ['6', '7', '8'], teacher: 'Fahad Iqbal' },
]

const mockExams = [
  { id: 'EX-1', name: 'Midterm Examination 2026', startDate: '2026-09-15', endDate: '2026-09-25', status: 'Scheduled' },
  { id: 'EX-2', name: 'Monthly Test - August', startDate: '2026-08-20', endDate: '2026-08-22', status: 'Completed' },
  { id: 'EX-3', name: 'Final Examination 2026', startDate: '2026-12-01', endDate: '2026-12-15', status: 'Scheduled' },
]

const mockAssignments = [
  { id: 'ASG-1', title: 'Algebra Worksheet', subject: 'Mathematics', class: '8-A', dueDate: '2026-08-20', status: 'Active' },
  { id: 'ASG-2', title: 'Essay: My Country', subject: 'English', class: '7-B', dueDate: '2026-08-22', status: 'Active' },
  { id: 'ASG-3', title: 'Lab Report: Photosynthesis', subject: 'Biology', class: '10-A', dueDate: '2026-08-18', status: 'Completed' },
]

export default function Academics() {
  const toast = useToast()
  const [tab, setTab] = useState('subjects')
  const [subjects, setSubjects] = useState(mockSubjects)
  const [exams, setExams] = useState(mockExams)
  const [assignments, setAssignments] = useState(mockAssignments)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({})
  const [deleteId, setDeleteId] = useState(null)
  const [deleteType, setDeleteType] = useState('')

  const tabs = [
    { id: 'subjects', label: 'Subjects' },
    { id: 'exams', label: 'Exams' },
    { id: 'results', label: 'Results' },
    { id: 'assignments', label: 'Assignments' },
  ]

  const openAdd = () => {
    setEditId(null)
    if (tab === 'subjects') setForm({ name: '', code: '', classes: '', teacher: '' })
    else if (tab === 'exams') setForm({ name: '', startDate: '', endDate: '' })
    else setForm({ title: '', subject: '', class: '', dueDate: '' })
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (tab === 'subjects') {
      if (editId) {
        setSubjects(prev => prev.map(s => s.id === editId ? { ...s, ...form, classes: form.classes.split(',').map(c => c.trim()) } : s))
        toast.success('Subject updated')
      } else {
        setSubjects(prev => [...prev, { id: 'SUB-' + (prev.length + 1), ...form, classes: form.classes.split(',').map(c => c.trim()) }])
        toast.success('Subject added')
      }
    } else if (tab === 'exams') {
      if (editId) {
        setExams(prev => prev.map(x => x.id === editId ? { ...x, ...form } : x))
        toast.success('Exam updated')
      } else {
        setExams(prev => [...prev, { id: 'EX-' + (prev.length + 1), ...form, status: 'Scheduled' }])
        toast.success('Exam created')
      }
    } else {
      if (editId) {
        setAssignments(prev => prev.map(a => a.id === editId ? { ...a, ...form } : a))
        toast.success('Assignment updated')
      } else {
        setAssignments(prev => [...prev, { id: 'ASG-' + (prev.length + 1), ...form, status: 'Active' }])
        toast.success('Assignment created')
      }
    }
    setModalOpen(false)
  }

  const handleDelete = () => {
    if (deleteType === 'subjects') setSubjects(prev => prev.filter(s => s.id !== deleteId))
    else if (deleteType === 'exams') setExams(prev => prev.filter(e => e.id !== deleteId))
    else setAssignments(prev => prev.filter(a => a.id !== deleteId))
    toast.success('Deleted successfully')
    setDeleteId(null)
  }

  return (
    <div>
      <PageHeader
        title="Academics"
        subtitle="Manage subjects, exams, results, and assignments"
        actions={<Button onClick={openAdd}><Plus className="w-4 h-4" /><span className="hidden sm:inline">Add {tab === 'subjects' ? 'Subject' : tab === 'exams' ? 'Exam' : 'Assignment'}</span></Button>}
      />

      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} className="mb-6" />

      {tab === 'subjects' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(sub => (
            <Card key={sub.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(sub.id); setForm({ name: sub.name, code: sub.code, classes: sub.classes.join(', '), teacher: sub.teacher }); setModalOpen(true) }} className="p-1.5 rounded-btn text-ink-muted hover:bg-surface-hover hover:text-ink"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => { setDeleteId(sub.id); setDeleteType('subjects') }} className="p-1.5 rounded-btn text-ink-muted hover:bg-danger-bg hover:text-danger"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-ink">{sub.name}</h3>
              <p className="text-xs text-ink-muted mt-0.5">{sub.code}</p>
              <p className="text-xs text-ink-secondary mt-2">Teacher: {sub.teacher}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {sub.classes.map(c => <span key={c} className="badge bg-surface-app text-ink-secondary">Class {c}</span>)}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'exams' && (
        <Card padding={false}>
          <div className="divide-y divide-border">
            {exams.map(ex => (
              <div key={ex.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-btn bg-surface-app flex items-center justify-center"><FileCheck className="w-5 h-5 text-ink-secondary" /></div>
                  <div>
                    <p className="text-sm font-medium text-ink">{ex.name}</p>
                    <p className="text-xs text-ink-muted">{formatDate(ex.startDate)} — {formatDate(ex.endDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={ex.status} />
                  <button onClick={() => { setEditId(ex.id); setForm({ name: ex.name, startDate: ex.startDate, endDate: ex.endDate }); setModalOpen(true) }} className="p-1.5 rounded-btn text-ink-muted hover:bg-surface-hover hover:text-ink"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => { setDeleteId(ex.id); setDeleteType('exams') }} className="p-1.5 rounded-btn text-ink-muted hover:bg-danger-bg hover:text-danger"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'results' && (
        <Card><EmptyState icon={Award} title="Results will be available after exams" description="Exam results will appear here once the midterm examination is completed." /></Card>
      )}

      {tab === 'assignments' && (
        <Card padding={false}>
          <div className="divide-y divide-border">
            {assignments.map(asg => (
              <div key={asg.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-btn bg-surface-app flex items-center justify-center"><ClipboardList className="w-5 h-5 text-ink-secondary" /></div>
                  <div>
                    <p className="text-sm font-medium text-ink">{asg.title}</p>
                    <p className="text-xs text-ink-muted">{asg.subject} • {asg.class} • Due: {formatDate(asg.dueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={asg.status} />
                  <button onClick={() => { setEditId(asg.id); setForm({ title: asg.title, subject: asg.subject, class: asg.class, dueDate: asg.dueDate }); setModalOpen(true) }} className="p-1.5 rounded-btn text-ink-muted hover:bg-surface-hover hover:text-ink"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => { setDeleteId(asg.id); setDeleteType('assignments') }} className="p-1.5 rounded-btn text-ink-muted hover:bg-danger-bg hover:text-danger"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit' : 'Add'} size="md" footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Save</Button></>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'subjects' && (
            <>
              <Input label="Subject Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics" />
              <Input label="Subject Code" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. MATH-101" />
              <Input label="Classes (comma-separated)" value={form.classes || ''} onChange={(e) => setForm({ ...form, classes: e.target.value })} placeholder="6, 7, 8" />
              <Input label="Teacher" value={form.teacher || ''} onChange={(e) => setForm({ ...form, teacher: e.target.value })} placeholder="e.g. Sadia Rahman" />
            </>
          )}
          {tab === 'exams' && (
            <>
              <Input label="Exam Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Midterm 2026" />
              <Input label="Start Date" type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              <Input label="End Date" type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </>
          )}
          {tab === 'assignments' && (
            <>
              <Input label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Algebra Worksheet" />
              <Input label="Subject" value={form.subject || ''} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" />
              <Input label="Class" value={form.class || ''} onChange={(e) => setForm({ ...form, class: e.target.value })} placeholder="e.g. 8-A" />
              <Input label="Due Date" type="date" value={form.dueDate || ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </>
          )}
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete" message="Are you sure you want to delete this item?" confirmLabel="Delete" />
    </div>
  )
}
