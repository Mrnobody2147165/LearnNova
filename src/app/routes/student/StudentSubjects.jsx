import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import LoadingState from '../../../components/ui/LoadingState'
import { studentSubjects } from '../../../data/academics'

export default function StudentSubjects() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSubjects(studentSubjects)
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader title="My Subjects" subtitle="Your enrolled subjects and progress" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(subject => (
          <Card key={subject.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-success">{subject.progress}%</span>
            </div>
            <h3 className="text-base font-semibold text-ink">{subject.name}</h3>
            <p className="text-sm text-ink-secondary mb-4">{subject.teacher}</p>

            <div className="h-2 bg-surface-app rounded-full overflow-hidden mb-4">
              <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${subject.progress}%` }} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 rounded-btn bg-surface-app">
                <p className="text-sm font-semibold text-ink">{subject.average}%</p>
                <p className="text-xs text-ink-muted">Average</p>
              </div>
              <div className="text-center p-2 rounded-btn bg-surface-app">
                <p className="text-sm font-semibold text-ink">{subject.homeworkCount}</p>
                <p className="text-xs text-ink-muted">Homework</p>
              </div>
              <div className="text-center p-2 rounded-btn bg-surface-app">
                <p className="text-sm font-semibold text-ink">{subject.examCount}</p>
                <p className="text-xs text-ink-muted">Exams</p>
              </div>
            </div>

            <Button variant="secondary" className="w-full" onClick={() => navigate(`/student/subjects/${subject.id}`)}>
              Open Subject
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
