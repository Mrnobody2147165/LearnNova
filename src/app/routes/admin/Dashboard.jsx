import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Wallet, AlertCircle, TrendingUp, Plus, ArrowRight, UserPlus, Bell, CalendarCheck, BookMarked } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PageHeader from '../../../components/ui/PageHeader'
import StatCard from '../../../components/ui/StatCard'
import Card from '../../../components/ui/Card'
import StatusBadge from '../../../components/ui/StatusBadge'
import Avatar from '../../../components/ui/Avatar'
import Button from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/authStore'
import dashboardService from '../../../services/dashboard'
import homeworkService from '../../../services/homework'
import { formatPKR, formatPKRFull, formatDate, formatDateShort } from '../../../utils/format'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    activeStudents: 0,
    newStudents: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    collectionRate: 0,
    attendance: { presentPct: 0, absentPct: 0, latePct: 0 },
  })
  const [chartData, setChartData] = useState([])
  const [payments, setPayments] = useState([])
  const [admissions, setAdmissions] = useState([])
  const [activeHomework, setActiveHomework] = useState([])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const userName = user?.name?.split(' ')[0] || 'Admin'

  useEffect(() => {
    // 1. Dashboard aggregate metrics
    dashboardService.getStats().then(stats => {
      if (stats) setMetrics(stats)
    })

    // 2. Monthly collection chart
    dashboardService.getMonthlyCollectionChart().then(chart => {
      if (chart && chart.length > 0) setChartData(chart)
    })

    // 3. Recent Admissions
    dashboardService.getRecentAdmissions(4).then(adm => {
      if (adm && adm.length > 0) setAdmissions(adm)
    })

    // 4. Recent Payments
    dashboardService.getRecentPayments(5).then(pmts => {
      if (pmts && pmts.length > 0) setPayments(pmts)
    })

    // 5. Active Homework
    homeworkService.getHomeworkList().then(hwList => {
      if (hwList) {
        setActiveHomework(hwList.filter(h => h.status === 'Active').slice(0, 4))
      }
    })
  }, [])

  const statCards = [
    { label: 'Total Students', value: metrics.totalStudents.toLocaleString(), icon: Users },
    { label: 'Attendance Rate', value: `${metrics.attendance.presentPct}%`, icon: CalendarCheck },
    { label: 'Fee Collected', value: formatPKR(metrics.totalCollected), icon: Wallet },
    { label: 'Outstanding Fees', value: formatPKR(metrics.totalOutstanding), icon: AlertCircle },
  ]

  const attentionItems = [
    { id: 'ATT-1', text: 'Unpaid challans need collection follow-up', action: 'View Students', link: '/students?feeStatus=Pending' },
    { id: 'ATT-2', text: 'Monthly fee invoices ready for dispatch', action: 'View Challans', link: '/challans' },
    { id: 'ATT-3', text: 'Homework submissions awaiting review', action: 'Review', link: '/homework' },
    { id: 'ATT-4', text: 'Student attendance reports ready for review', action: 'View Attendance', link: '/attendance' },
  ]

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${userName}.`}
        subtitle="Here's what's happening across Learnify today."
        actions={
          <Button onClick={() => navigate('/students')}>
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Student Overview + Fee Collection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Student Overview */}
        <Card>
          <h3 className="text-base font-semibold text-ink mb-4">Student Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-btn bg-surface-app">
              <span className="text-sm text-ink-secondary">Total Students</span>
              <span className="text-lg font-semibold text-ink">{metrics.totalStudents.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-btn bg-surface-app">
              <span className="text-sm text-ink-secondary">New Students</span>
              <span className="text-lg font-semibold text-ink">{metrics.newStudents}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-btn bg-surface-app">
              <span className="text-sm text-ink-secondary">Active Students</span>
              <span className="text-lg font-semibold text-ink">{metrics.activeStudents.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Fee Collection Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-ink">Fee Collection</h3>
              <p className="text-sm text-ink-secondary">Monthly collection vs target (Rate: {metrics.collectionRate}%)</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
              View Reports
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94A39A" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#94A39A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E4" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A39A' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatPKR(v)} tick={{ fontSize: 12, fill: '#94A39A' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                formatter={(v) => formatPKRFull(v)}
                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8E4', fontSize: 13, boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)' }}
              />
              <Area type="monotone" dataKey="target" stroke="#94A39A" strokeWidth={1.5} fill="url(#colorTarget)" strokeDasharray="5 5" name="Target" />
              <Area type="monotone" dataKey="collected" stroke="#16A34A" strokeWidth={2} fill="url(#colorCollected)" name="Collected" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Attendance + Homework */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Attendance */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Attendance Summary</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/attendance')}>
              View
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-ink-secondary">Present</span>
                <span className="text-sm font-semibold text-success">{metrics.attendance.presentPct}%</span>
              </div>
              <div className="h-2 bg-surface-app rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${metrics.attendance.presentPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-ink-secondary">Absent</span>
                <span className="text-sm font-semibold text-danger">{metrics.attendance.absentPct}%</span>
              </div>
              <div className="h-2 bg-surface-app rounded-full overflow-hidden">
                <div className="h-full bg-danger rounded-full" style={{ width: `${metrics.attendance.absentPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-ink-secondary">Late</span>
                <span className="text-sm font-semibold text-warning">{metrics.attendance.latePct}%</span>
              </div>
              <div className="h-2 bg-surface-app rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: `${metrics.attendance.latePct}%` }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Homework */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Active Homework</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/homework')}>
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {activeHomework.map(hw => (
              <div key={hw.id} className="p-2.5 rounded-btn bg-surface-app">
                <p className="text-sm font-medium text-ink truncate">{hw.title}</p>
                <p className="text-xs text-ink-muted">{hw.subject} • Due {formatDateShort(hw.dueDate)}</p>
              </div>
            ))}
            {activeHomework.length === 0 && <p className="text-sm text-ink-muted text-center py-4">No active homework</p>}
          </div>
        </Card>
      </div>

      {/* Needs Attention + Recent Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-warning" />
            <h3 className="text-base font-semibold text-ink">Needs Attention</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attentionItems.map(item => (
              <div key={item.id} className="flex flex-col gap-2 p-3 rounded-btn bg-surface-app border border-border">
                <p className="text-sm text-ink">{item.text}</p>
                <Button variant="secondary" size="sm" onClick={() => navigate(item.link)}>
                  {item.action}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-ink">Recent Admissions</h3>
          </div>
          <div className="space-y-3">
            {admissions.map(student => (
              <div
                key={student.id}
                className="flex items-center gap-3 p-2 rounded-btn hover:bg-surface-hover cursor-pointer"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <Avatar name={student.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{student.name}</p>
                  <p className="text-xs text-ink-muted">{student.class} • {formatDate(student.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-ink">Recent Payments</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/payments')}>
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-border">
                <th className="table-header">Student</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Date</th>
                <th className="table-header">Method</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar name={payment.student} size="sm" />
                      <span className="font-medium">{payment.student}</span>
                    </div>
                  </td>
                  <td className="table-cell font-medium">{formatPKRFull(payment.amount)}</td>
                  <td className="table-cell text-ink-secondary">{formatDate(payment.date)}</td>
                  <td className="table-cell text-ink-secondary">{payment.method}</td>
                  <td className="table-cell"><StatusBadge status={payment.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
