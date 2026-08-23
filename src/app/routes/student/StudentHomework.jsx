import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Tabs from '../../../components/ui/Tabs'
import StatusBadge from '../../../components/ui/StatusBadge'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import { homework, homeworkSubmissions } from '../../../data/academics'
import { formatDateShort } from '../../../utils/format'

export default function StudentHomework() {
  const navigate = useNavigate()
  const [homeworkList, setHomeworkList] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => {
      const mySubs = homeworkSubmissions.filter(s => s.studentId === 'STU-2026-00124')
      const list = homework.map(h => {
        const sub = mySubs.find(s => s.homeworkId === h.id)
        return { ...h, submissionStatus: sub?.status || 'Pending' }
      })
      setHomeworkList(list)
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <LoadingState />

  const filtered = activeTab === 'all'
    ? homeworkList
    : homeworkList.filter(h => h.submissionStatus.toLowerCase() === activeTab.toLowerCase())

  return (
    <div>
      <PageHeader title="My Homework" subtitle="Your assignments and submissions" />

      <Tabs
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'submitted', label: 'Submitted' },
          { id: 'graded', label: 'Graded' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No homework found" description="No assignments match this filter" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(hw => (
            <Card
              key={hw.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => navigate(`/student/homework/${hw.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <StatusBadge status={hw.submissionStatus === 'Pending' ? 'Pending' : hw.submissionStatus} />
              </div>
              <h3 className="text-base font-semibold text-ink">{hw.title}</h3>
              <p className="text-sm text-ink-secondary">{hw.subject}</p>
              <p className="text-xs text-ink-muted mt-2">Teacher: {hw.teacher}</p>
              <p className="text-xs text-ink-muted">Due: {formatDateShort(hw.dueDate)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
