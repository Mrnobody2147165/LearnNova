import { TrendingUp, ArrowUp, Award, Target } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import { studentSubjects, monthlyProgress } from '../../../data/academics'

export default function StudentProgress() {
  const overallProgress = 89
  const juneProgress = monthlyProgress.find(m => m.month === 'June')?.progress || 78
  const improvement = overallProgress - juneProgress

  const sorted = [...studentSubjects].sort((a, b) => b.progress - a.progress)
  const strengths = sorted.slice(0, 2)
  const improvements = sorted.slice(-2).reverse()

  return (
    <div>
      <PageHeader title="My Progress" subtitle="Track your academic performance over time" />

      {/* Overall Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="sm:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-ink-secondary">Overall Progress</span>
          </div>
          <p className="text-3xl font-semibold text-success">{overallProgress}%</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-btn bg-success-bg flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-ink-secondary">Improvement</span>
          </div>
          <p className="text-3xl font-semibold text-success">+{improvement}%</p>
          <p className="text-xs text-ink-muted mt-1">since June</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-ink-secondary">Best Subject</span>
          </div>
          <p className="text-lg font-semibold text-ink">{sorted[0].name}</p>
          <p className="text-xs text-ink-muted mt-1">{sorted[0].progress}%</p>
        </Card>
      </div>

      {/* Subject Progress */}
      <Card className="mb-6">
        <h3 className="text-base font-semibold text-ink mb-4">Subject Progress</h3>
        <div className="space-y-4">
          {studentSubjects.map(subject => (
            <div key={subject.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-ink">{subject.name}</span>
                <span className="text-sm font-semibold text-success">{subject.progress}%</span>
              </div>
              <div className="h-2.5 bg-surface-app rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${subject.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly Progress Chart */}
      <Card className="mb-6">
        <h3 className="text-base font-semibold text-ink mb-4">Monthly Progress</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthlyProgress} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E4" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A39A' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94A39A' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8E4', fontSize: 13 }} />
            <Line type="monotone" dataKey="progress" stroke="#16A34A" strokeWidth={2.5} dot={{ fill: '#16A34A', r: 4 }} name="Progress" />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-sm text-success mt-3 flex items-center gap-1">
          <ArrowUp className="w-4 h-4" /> {improvement}% improvement since June
        </p>
      </Card>

      {/* Strengths & Areas to Improve */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-success" />
            <h3 className="text-base font-semibold text-ink">Strengths</h3>
          </div>
          <div className="space-y-2">
            {strengths.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded-btn bg-success-bg">
                <span className="text-sm font-medium text-ink">{s.name}</span>
                <span className="text-sm font-semibold text-success">{s.progress}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-warning" />
            <h3 className="text-base font-semibold text-ink">Areas to Improve</h3>
          </div>
          <div className="space-y-2">
            {improvements.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded-btn bg-warning-bg">
                <span className="text-sm font-medium text-ink">{s.name}</span>
                <span className="text-sm font-semibold text-warning">{s.progress}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
