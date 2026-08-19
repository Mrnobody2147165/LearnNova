import { BookOpen, CalendarCheck, Award, FileText } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import StatCard from '../../../components/ui/StatCard'
import { formatDate } from '../../../utils/format'

export default function StudentDashboard() {
  return (
    <div>
      <PageHeader title="Student Portal" subtitle="Welcome, Ahmed Khan — Class 8-B" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Subjects" value="7" icon={BookOpen} />
        <StatCard label="Attendance" value="92%" icon={CalendarCheck} />
        <StatCard label="Average Grade" value="A" icon={Award} />
        <StatCard label="Assignments Due" value="2" icon={FileText} />
      </div>
      <Card padding={false} className="mb-4">
        <div className="p-5 border-b border-border"><h3 className="text-base font-semibold text-ink">Recent Results</h3></div>
        <div className="divide-y divide-border">
          {[
            { subject: 'Mathematics', marks: 87, grade: 'A' },
            { subject: 'English', marks: 78, grade: 'B+' },
            { subject: 'Physics', marks: 82, grade: 'A-' },
            { subject: 'Chemistry', marks: 91, grade: 'A+' },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <p className="text-sm font-medium text-ink">{r.subject}</p>
              <div className="flex items-center gap-3"><span className="text-sm text-ink-secondary">{r.marks}/100</span><span className="badge bg-primary-light text-primary">{r.grade}</span></div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="text-base font-semibold text-ink mb-4">Upcoming Assignments</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface-app rounded-btn"><div><p className="text-sm font-medium text-ink">Algebra Worksheet</p><p className="text-xs text-ink-muted">Mathematics • Due: {formatDate('2026-08-20')}</p></div><span className="badge bg-warning-bg text-warning">Due Soon</span></div>
          <div className="flex items-center justify-between p-3 bg-surface-app rounded-btn"><div><p className="text-sm font-medium text-ink">Lab Report: Photosynthesis</p><p className="text-xs text-ink-muted">Biology • Due: {formatDate('2026-08-22')}</p></div><span className="badge bg-info-bg text-info">Active</span></div>
        </div>
      </Card>
    </div>
  )
}
