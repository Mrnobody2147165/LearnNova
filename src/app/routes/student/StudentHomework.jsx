import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Tabs from '../../../components/ui/Tabs'
import StatusBadge from '../../../components/ui/StatusBadge'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import homeworkService from '../../../services/homework'
import { useAuthStore } from '../../../stores/authStore'
import { formatDateShort } from '../../../utils/format'

export default function StudentHomework() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [homeworkList, setHomeworkList] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const studentId = user?.studentId || user?.id
    const studentClass = user?.class

    Promise.all([
      homeworkService.getHomeworkList({ classFilter: studentClass }),
      homeworkService.getSubmissions(null, studentId),
    ]).then(([hwData, subs]) => {
      const list = (hwData || []).map(h => {
        const sub = (subs || []).find(s => s.homeworkId === h.id)
        return { ...h, submissionStatus: sub?.status || 'Pending' }
      })
      setHomeworkList(list)
      setLoading(false)
    })
  }, [user])

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
        <EmptyState icon={ClipboardList} title="No homework found" description="No assignments match this filter." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(hw => (
            <Card
              key={hw.id}
              className="cursor-pointer hover:border-primary hover:shadow-card transition-all"
              onClick={() => navigate(`/student/homework/${hw.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary">
                  {hw.subject}
                </span>
                <StatusBadge status={hw.submissionStatus} />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1">{hw.title}</h3>
              <p className="text-sm text-ink-secondary mb-4 line-clamp-2">{hw.description}</p>
              <div className="flex items-center justify-between text-xs text-ink-muted pt-3 border-t border-border">
                <span>{hw.class}</span>
                <span>Due {formatDateShort(hw.dueDate)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
