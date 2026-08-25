import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import subjectService from '../../../services/subjects'
import { useAuthStore } from '../../../stores/authStore'

export default function StudentSubjects() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const studentId = user?.studentId || user?.id
    const studentClass = user?.class
    subjectService.getStudentSubjects(studentId, studentClass).then(data => {
      setSubjects(data || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader title="My Subjects" subtitle="Your enrolled subjects and syllabus progress" />

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects enrolled"
          description="Enrolled curriculum subjects for your class will be listed here."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(subject => (
            <Card key={subject.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-primary">{subject.progress}%</span>
              </div>
              <h3 className="text-base font-semibold text-ink">{subject.name}</h3>
              <p className="text-sm text-ink-secondary mb-4">{subject.teacher}</p>

              <div className="h-2 bg-surface-app rounded-full overflow-hidden mb-4">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${subject.progress}%` }} />
              </div>

              <Button variant="secondary" className="w-full" onClick={() => navigate(`/student/subjects/${subject.id}`)}>
                View Curriculum
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
