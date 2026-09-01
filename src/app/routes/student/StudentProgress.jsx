import { TrendingUp, Award, Target, TrendingDown } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import { useAuthStore } from '../../../stores/authStore'

const performanceData = [
  { subject: 'Mathematics', current: 88, previous: 82, trend: 'up' },
  { subject: 'English', current: 82, previous: 78, trend: 'up' },
  { subject: 'Science', current: 76, previous: 80, trend: 'down' },
  { subject: 'Urdu', current: 90, previous: 85, trend: 'up' },
  { subject: 'Social Studies', current: 72, previous: 70, trend: 'up' },
]

export default function StudentProgress() {
  const { user } = useAuthStore()

  const average = (performanceData.reduce((a, p) => a + p.current, 0) / performanceData.length).toFixed(0)
  const improvements = performanceData.filter(p => p.trend === 'up').length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Progress"
        subtitle={`Track your academic performance — Class ${user?.class || ''}-${user?.section || ''}`}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 text-center">
          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-2">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary">{average}%</p>
          <p className="text-sm text-ink-muted mt-1">Current Average</p>
        </Card>
        <Card className="p-5 text-center">
          <div className="w-10 h-10 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <p className="text-2xl font-bold text-success">{improvements}</p>
          <p className="text-sm text-ink-muted mt-1">Subjects Improved</p>
        </Card>
        <Card className="p-5 text-center">
          <div className="w-10 h-10 rounded-full bg-warning-bg flex items-center justify-center mx-auto mb-2">
            <Target className="w-5 h-5 text-warning" />
          </div>
          <p className="text-2xl font-bold text-warning">{performanceData.length - improvements}</p>
          <p className="text-sm text-ink-muted mt-1">Need Attention</p>
        </Card>
      </div>

      {/* Subject Progress */}
      <h2 className="text-base font-semibold text-ink">Subject-wise Progress</h2>
      <div className="space-y-3">
        {performanceData.map((p, i) => {
          const diff = p.current - p.previous
          const isUp = p.trend === 'up'
          return (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-ink text-sm">{p.subject}</h3>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-success' : 'text-danger'}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {diff > 0 ? '+' : ''}{diff}%
                  </span>
                </div>
                <span className="text-sm font-semibold text-ink">{p.current}%</span>
              </div>
              <div className="w-full h-2 bg-surface-app rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${p.current}%`,
                    backgroundColor: p.current >= 80 ? '#16A34A' : p.current >= 60 ? '#EAB308' : '#EF4444',
                  }}
                />
              </div>
              <p className="text-xs text-ink-muted mt-1.5">Previous: {p.previous}%</p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
