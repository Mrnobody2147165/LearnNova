import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, FileText, CalendarCheck, GraduationCap, ArrowRight } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import Button from '../../../components/ui/Button'
import LoadingState from '../../../components/ui/LoadingState'
import studentService from '../../../services/students'
import { useAuthStore } from '../../../stores/authStore'
import { formatPKRFull, formatDate } from '../../../utils/format'

export default function ParentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentService.getParentDashboard().then(res => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingState />

  const parentName = user?.name || 'Imran Khan'
  const studentName = 'Ahmed Khan'

  return (
    <div>
      <PageHeader title="Parent Portal" subtitle={`Welcome, ${parentName} — Parent of ${studentName}`} />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div onClick={() => navigate('/fees')} className="cursor-pointer">
          <StatCard label="Outstanding Fees" value={formatPKRFull(data?.outstanding || 11500)} icon={Wallet} />
        </div>
        <div onClick={() => navigate('/challans')} className="cursor-pointer">
          <StatCard label="Pending Challans" value={data?.pendingCount || 1} icon={FileText} />
        </div>
        <StatCard label="Attendance" value={`${data?.attendanceRate || 92}%`} icon={CalendarCheck} />
        <StatCard label="Current Grade" value={data?.grade || 'A'} icon={GraduationCap} />
      </div>

      <Card padding={false} className="mb-4">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">Recent Challans</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/challans')}>
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-border">
          {(data?.recentChallans || []).map((c, i) => (
            <div
              key={i}
              onClick={() => navigate('/challans')}
              className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium text-ink">{c.no}</p>
                <p className="text-xs text-ink-muted">{c.month} • Due: {formatDate(c.due)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ink">{formatPKRFull(c.amount)}</span>
                <StatusBadge status={c.status} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-ink mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-surface-app rounded-btn">
            <div className="w-8 h-8 rounded-full bg-warning-bg flex items-center justify-center">
              <FileText className="w-4 h-4 text-warning" />
            </div>
            <p className="text-sm text-ink">Fee challan for August 2026 is now available</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface-app rounded-btn">
            <div className="w-8 h-8 rounded-full bg-success-bg flex items-center justify-center">
              <CalendarCheck className="w-4 h-4 text-success" />
            </div>
            <p className="text-sm text-ink">Ahmed attended all classes this week</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
