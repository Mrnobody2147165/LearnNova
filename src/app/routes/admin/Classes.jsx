import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, BookOpen, ArrowRight } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import LoadingState from '../../../components/ui/LoadingState'
import { useToast } from '../../../components/ui/Toast'
import studentService from '../../../services/students'

export default function Classes() {
  const navigate = useNavigate()
  const toast = useToast()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentService.getClasses().then(data => {
      setClasses(data)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle={`${classes.length} classes configured`}
        actions={
          <Button onClick={() => toast.info('Class creation will be available with backend integration')}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Class</span>
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map(cls => (
            <Card
              key={cls.id}
              className="cursor-pointer hover:border-primary hover:shadow-card transition-all group"
              padding={false}
            >
              <button
                onClick={() => navigate(`/students?class=${cls.name.replace('Class ', '')}`)}
                className="w-full text-left p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-ink mb-1">{cls.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-ink-secondary mb-3">
                  <Users className="w-3.5 h-3.5" />
                  {cls.students} students
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span>Teacher: {cls.teacher}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {cls.sections.map(s => (
                    <span key={s} className="badge bg-surface-app text-ink-secondary">Section {s}</span>
                  ))}
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
