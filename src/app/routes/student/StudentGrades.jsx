import { Award } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import { useAuthStore } from '../../../stores/authStore'

const mockGrades = [
  { subject: 'Mathematics', grade: 'A', marks: 88, total: 100, term: 'Mid-Term' },
  { subject: 'English', grade: 'A-', marks: 82, total: 100, term: 'Mid-Term' },
  { subject: 'Science', grade: 'B+', marks: 76, total: 100, term: 'Mid-Term' },
  { subject: 'Urdu', grade: 'A', marks: 90, total: 100, term: 'Mid-Term' },
  { subject: 'Social Studies', grade: 'B', marks: 72, total: 100, term: 'Mid-Term' },
]

export default function StudentGrades() {
  const { user } = useAuthStore()

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Grades"
        subtitle={`Class ${user?.class || ''}-${user?.section || ''} — Mid-Term Results`}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-app">
                <th className="text-left px-4 py-3 font-medium text-ink-secondary">Subject</th>
                <th className="text-center px-4 py-3 font-medium text-ink-secondary">Marks</th>
                <th className="text-center px-4 py-3 font-medium text-ink-secondary">Total</th>
                <th className="text-center px-4 py-3 font-medium text-ink-secondary">Percentage</th>
                <th className="text-center px-4 py-3 font-medium text-ink-secondary">Grade</th>
                <th className="text-left px-4 py-3 font-medium text-ink-secondary hidden sm:table-cell">Term</th>
              </tr>
            </thead>
            <tbody>
              {mockGrades.map((g, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{g.subject}</td>
                  <td className="px-4 py-3 text-center text-ink">{g.marks}</td>
                  <td className="px-4 py-3 text-center text-ink-secondary">{g.total}</td>
                  <td className="px-4 py-3 text-center text-ink">{((g.marks / g.total) * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-success-bg text-success">
                      {g.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary hidden sm:table-cell">{g.term}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 text-center">
          <p className="text-2xl font-bold text-primary">
            {(mockGrades.reduce((a, g) => a + g.marks, 0) / mockGrades.length).toFixed(0)}%
          </p>
          <p className="text-sm text-ink-muted mt-1">Average</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-2xl font-bold text-primary">{Math.max(...mockGrades.map(g => g.marks))}</p>
          <p className="text-sm text-ink-muted mt-1">Highest Score</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-2xl font-bold text-primary">{mockGrades.length}</p>
          <p className="text-sm text-ink-muted mt-1">Subjects</p>
        </Card>
      </div>
    </div>
  )
}
