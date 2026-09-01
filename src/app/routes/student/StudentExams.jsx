import { FileText, Calendar } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import { useAuthStore } from '../../../stores/authStore'

const mockExams = [
  { name: 'Mid-Term Examination', subject: 'Mathematics', date: '2026-03-15', time: '09:00 AM', duration: '2 hours', status: 'Completed', marks: '88/100' },
  { name: 'Mid-Term Examination', subject: 'English', date: '2026-03-17', time: '09:00 AM', duration: '2 hours', status: 'Completed', marks: '82/100' },
  { name: 'Mid-Term Examination', subject: 'Science', date: '2026-03-19', time: '09:00 AM', duration: '2 hours', status: 'Completed', marks: '76/100' },
  { name: 'Final Examination', subject: 'Mathematics', date: '2026-06-10', time: '09:00 AM', duration: '3 hours', status: 'Upcoming', marks: '-' },
  { name: 'Final Examination', subject: 'English', date: '2026-06-12', time: '09:00 AM', duration: '3 hours', status: 'Upcoming', marks: '-' },
  { name: 'Final Examination', subject: 'Science', date: '2026-06-14', time: '09:00 AM', duration: '3 hours', status: 'Upcoming', marks: '-' },
]

export default function StudentExams() {
  const { user } = useAuthStore()

  const completed = mockExams.filter(e => e.status === 'Completed')
  const upcoming = mockExams.filter(e => e.status === 'Upcoming')

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Exams"
        subtitle={`Class ${user?.class || ''}-${user?.section || ''}`}
      />

      {/* Upcoming Exams */}
      <div>
        <h2 className="text-base font-semibold text-ink mb-3">Upcoming Exams</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={Calendar} title="No upcoming exams" description="You have no scheduled exams at this time." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((exam, i) => (
              <Card key={i} className="p-5 border-l-4 border-l-warning">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <h3 className="font-medium text-ink">{exam.subject}</h3>
                    <p className="text-sm text-ink-muted mt-1">{exam.name}</p>
                    <div className="mt-2 space-y-0.5 text-xs text-ink-muted">
                      <p>Date: {exam.date}</p>
                      <p>Time: {exam.time}</p>
                      <p>Duration: {exam.duration}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Exams */}
      <div>
        <h2 className="text-base font-semibold text-ink mb-3">Completed Exams</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-app">
                  <th className="text-left px-4 py-3 font-medium text-ink-secondary">Exam</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-secondary">Subject</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-secondary hidden sm:table-cell">Date</th>
                  <th className="text-center px-4 py-3 font-medium text-ink-secondary">Marks</th>
                  <th className="text-center px-4 py-3 font-medium text-ink-secondary">Status</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((exam, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-ink">{exam.name}</td>
                    <td className="px-4 py-3 font-medium text-ink">{exam.subject}</td>
                    <td className="px-4 py-3 text-ink-secondary hidden sm:table-cell">{exam.date}</td>
                    <td className="px-4 py-3 text-center text-ink font-medium">{exam.marks}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-bg text-success">
                        {exam.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
