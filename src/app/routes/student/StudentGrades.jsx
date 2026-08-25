import { useState, useEffect } from 'react'
import { GraduationCap } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import examService from '../../../services/exams'
import { useAuthStore } from '../../../stores/authStore'

export default function StudentGrades() {
  const { user } = useAuthStore()
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const studentId = user?.studentId || user?.id
    examService.getStudentGrades(studentId).then(data => {
      setGrades(data || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <LoadingState />

  const overallAvg = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.overall || 0), 0) / grades.length)
    : 0

  const standing = overallAvg >= 80 ? 'Excellent (A)' : overallAvg >= 70 ? 'Good (B)' : overallAvg >= 50 ? 'Passing (C)' : 'Pending Evaluation'

  return (
    <div>
      <PageHeader title="My Grades" subtitle="Subject-wise breakdown of quizzes, tests, and exams" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <span className="text-xs text-ink-muted">Overall Average</span>
          <p className="text-2xl font-bold text-ink mt-1">{overallAvg}%</p>
        </Card>
        <Card>
          <span className="text-xs text-ink-muted">Subjects Graded</span>
          <p className="text-2xl font-bold text-ink mt-1">{grades.length}</p>
        </Card>
        <Card>
          <span className="text-xs text-ink-muted">Academic Standing</span>
          <p className="text-2xl font-bold text-success mt-1">{standing}</p>
        </Card>
      </div>

      {grades.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No grades published yet"
          description="Your graded tests, quizzes, and term exam marks will appear here once published by your teachers."
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Subject</th>
                  <th className="table-header text-right">Quizzes</th>
                  <th className="table-header text-right">Tests</th>
                  <th className="table-header text-right">Monthly Exam</th>
                  <th className="table-header text-right">Overall</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(grade => (
                  <tr key={grade.subject} className="border-b border-border last:border-0 hover:bg-surface-hover">
                    <td className="table-cell font-medium text-ink">{grade.subject}</td>
                    <td className="table-cell text-right text-ink-secondary">{grade.quiz}%</td>
                    <td className="table-cell text-right text-ink-secondary">{grade.test}%</td>
                    <td className="table-cell text-right text-ink-secondary">{grade.monthlyExam}%</td>
                    <td className="table-cell text-right font-bold text-primary">{grade.overall}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
