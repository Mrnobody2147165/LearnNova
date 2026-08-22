import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Modal from '../../../components/ui/Modal'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import LoadingState from '../../../components/ui/LoadingState'
import { useToast } from '../../../components/ui/Toast'
import feeService from '../../../services/fees'
import { formatPKRFull } from '../../../utils/format'

const emptyForm = { class: '', dueDate: 10, lateFee: 200, items: [{ name: 'Tuition', amount: 8000 }, { name: 'Computer', amount: 1000 }, { name: 'Exam', amount: 500 }, { name: 'Transport', amount: 2000 }] }

export default function FeeStructure() {
  const toast = useToast()
  const [structures, setStructures] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    feeService.getStructures().then(data => {
      setStructures(data)
      setLoading(false)
    })
  }, [])

  const validate = () => {
    const errs = {}
    if (!form.class) errs.class = 'Class is required'
    if (!form.items || form.items.length === 0) errs.items = 'At least one fee item is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    if (editId) {
      const updated = await feeService.updateStructure(editId, form)
      setStructures(prev => prev.map(s => s.id === editId ? updated : s))
      toast.success('Fee structure updated successfully')
    } else {
      const created = await feeService.createStructure(form)
      setStructures(prev => [...prev, created])
      toast.success('Fee structure created successfully')
    }
    setModalOpen(false)
    setForm(emptyForm)
    setEditId(null)
    setErrors({})
  }

  const handleEdit = (fs) => {
    setEditId(fs.id)
    setForm({ class: fs.class, dueDate: fs.dueDate, lateFee: fs.lateFee, items: [...fs.items] })
    setModalOpen(true)
  }

  const handleDelete = async () => {
    await feeService.removeStructure(deleteId)
    setStructures(prev => prev.filter(s => s.id !== deleteId))
    toast.success('Fee structure deleted successfully')
    setDeleteId(null)
  }

  const updateItem = (i, field, value) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, idx) => idx === i ? { ...item, [field]: field === 'amount' ? Number(value) : value } : item)
    }))
  }

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { name: '', amount: 0 }] }))
  }

  const removeItem = (i) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }))
  }

  const total = form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  return (
    <div>
      <PageHeader
        title="Fee Structures"
        subtitle="Create and manage fee structures for each class"
        actions={
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setModalOpen(true) }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Structure</span>
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {structures.map(fs => (
            <Card key={fs.id}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-ink">{fs.class}</h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(fs)} className="p-1.5 rounded-btn text-ink-muted hover:bg-surface-hover hover:text-ink transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteId(fs.id)} className="p-1.5 rounded-btn text-ink-muted hover:bg-danger-bg hover:text-danger transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {fs.items.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="text-ink-secondary">{item.name}</span>
                    <span className="text-ink">{formatPKRFull(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm font-semibold text-ink">Total</span>
                <span className="text-sm font-semibold text-primary">{formatPKRFull(fs.total)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-ink-muted">
                <span>Due: Day {fs.dueDate}</span>
                <span>Late Fee: {formatPKRFull(fs.lateFee)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setErrors({}) }}
        title={editId ? 'Edit Fee Structure' : 'Add Fee Structure'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? 'Save Changes' : 'Create Structure'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Class" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} error={errors.class} placeholder="e.g. Class 8" />
            <Input label="Due Date (day)" type="number" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: Number(e.target.value) })} />
            <Input label="Late Fee (PKR)" type="number" value={form.lateFee} onChange={(e) => setForm({ ...form, lateFee: Number(e.target.value) })} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Fee Categories</label>
              <Button variant="ghost" size="sm" type="button" onClick={addItem}>
                <Plus className="w-3.5 h-3.5" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(i, 'name', e.target.value)}
                    placeholder="Category name"
                    className="input flex-1"
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateItem(i, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="input w-32"
                  />
                  <button type="button" onClick={() => removeItem(i)} className="p-2 rounded-btn text-ink-muted hover:bg-danger-bg hover:text-danger transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-app rounded-btn">
            <span className="text-sm font-semibold text-ink">Total</span>
            <span className="text-sm font-semibold text-primary">{formatPKRFull(total)}</span>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Fee Structure"
        message="Are you sure you want to delete this fee structure?"
        confirmLabel="Delete"
      />
    </div>
  )
}
