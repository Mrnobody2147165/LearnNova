import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowRight } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import LoadingState from '../../../components/ui/LoadingState'
import { studentGrades } from '../../../data/academics'

export default function StudentGrades() {
  const navigate = useNavigate()
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setGrades(studentGrades)
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <LoadingState />

  const getGradeLetter = (pct) => {
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B+'
    if (pct >= 60) return 'B'
    if (pct >= 50) return 'C'
    return 'F'
  }

  return (
    <div>
      <PageHeader title="My Grades" subtitle="Your assessment results across all subjects" />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="table-header">Subject</th>
                <th className="table-header">Quiz</th>
                <th className="table-header">Test</th>
                <th className="table-header">Monthly Exam</th>
                <th className="table-header">Overall</th>
                <th className="table-header">Grade</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {grades.map(grade => (
                <tr key={grade.subjectId} className="border-b border-border last:border-0 hover:bg-surface-hover">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-btn bg-primary-light flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{grade.subject}</span>
                    </div>
                  </td>
                  <td className="table-cell">{grade.quiz}%</td>
                  <td className="table-cell">{grade.test}%</td>
                  <td className="table-cell">{grade.monthlyExam}%</td>
                  <td className="table-cell font-semibold text-success">{grade.overall}%</td>
                  <td className="table-cell">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-light text-primary text-sm font-semibold">
                      {getGradeLetter(grade.overall)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/student/subjects/${grade.subjectId}`)}>
                      Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
