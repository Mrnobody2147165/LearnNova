import { Wallet, FileText, CalendarCheck, GraduationCap } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import { formatPKRFull, formatDate } from '../../../utils/format'

export default function ParentDashboard() {
  return (
    <div>
      <PageHeader title="Parent Portal" subtitle="Welcome, Imran Khan — Parent of Ahmed Khan" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Outstanding Fees" value={formatPKRFull(11500)} icon={Wallet} />
        <StatCard label="Pending Challans" value="1" icon={FileText} />
        <StatCard label="Attendance" value="92%" icon={CalendarCheck} />
        <StatCard label="Current Grade" value="A" icon={GraduationCap} />
      </div>
      <Card padding={false} className="mb-4">
        <div className="p-5 border-b border-border"><h3 className="text-base font-semibold text-ink">Recent Challans</h3></div>
        <div className="divide-y divide-border">
          {[
            { no: 'CHL-2026-08-001', month: 'August 2026', amount: 11500, due: '2026-08-10', status: 'Pending' },
            { no: 'CHL-2026-07-001', month: 'July 2026', amount: 11500, due: '2026-07-10', status: 'Paid' },
            { no: 'CHL-2026-06-001', month: 'June 2026', amount: 11500, due: '2026-06-10', status: 'Paid' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div><p className="text-sm font-medium text-ink">{c.no}</p><p className="text-xs text-ink-muted">{c.month} • Due: {formatDate(c.due)}</p></div>
              <div className="flex items-center gap-3"><span className="text-sm font-medium text-ink">{formatPKRFull(c.amount)}</span><StatusBadge status={c.status} /></div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="text-base font-semibold text-ink mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-surface-app rounded-btn"><div className="w-8 h-8 rounded-full bg-warning-bg flex items-center justify-center"><FileText className="w-4 h-4 text-warning" /></div><p className="text-sm text-ink">Fee challan for August 2026 is now available</p></div>
          <div className="flex items-center gap-3 p-3 bg-surface-app rounded-btn"><div className="w-8 h-8 rounded-full bg-success-bg flex items-center justify-center"><CalendarCheck className="w-4 h-4 text-success" /></div><p className="text-sm text-ink">Ahmed attended all classes this week</p></div>
        </div>
      </Card>
    </div>
  )
}
