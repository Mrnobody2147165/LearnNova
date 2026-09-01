import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import LoadingState from '../../../components/ui/LoadingState'
import { useAuthStore } from '../../../stores/authStore'
import classService from '../../../services/classes'

export default function StudentSubjects() {
  const { user } = useAuthStore()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const classes = await classService.getAll()
        // Find the class matching the student's class
        const studentClass = `Class ${user?.class || '8'}`
        const matched = classes.find(c => c.name === studentClass)
        setSubjects(matched?.subjects || [])
      } catch (err) {
        console.warn('Subjects fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSubjects()
  }, [user?.class])

  if (loading) return <div className="p-6"><LoadingState /></div>

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="My Subjects"
        subtitle={`Class ${user?.class || ''}-${user?.section || ''}`}
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects available"
          description="Subjects for your class have not been configured yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject, i) => (
            <Card key={i} className="p-5 hover:shadow-card transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-ink">{subject}</h3>
                  <p className="text-xs text-ink-muted mt-0.5">Class {user?.class}-{user?.section}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
