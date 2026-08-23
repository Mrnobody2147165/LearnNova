import { useNavigate } from 'react-router-dom'
import { ClipboardList, Award, CalendarCheck, BookMarked, ArrowRight } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'

const academicModules = [
  { to: '/academics/exams', title: 'Exams', description: 'Create and manage examinations', icon: ClipboardList },
  { to: '/academics/grades', title: 'Grades', description: 'Enter and publish exam results', icon: Award },
  { to: '/academics/attendance', title: 'Attendance', description: 'Mark and track student attendance', icon: CalendarCheck },
  { to: '/academics/homework', title: 'Homework', description: 'Create and manage homework assignments', icon: BookMarked },
]

export default function Academics() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader title="Academics" subtitle="Manage your school's academic activities" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {academicModules.map(module => {
          const Icon = module.icon
          return (
            <Card
              key={module.to}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => navigate(module.to)}
            >
              <div className="w-12 h-12 rounded-btn bg-primary-light flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-1">{module.title}</h3>
              <p className="text-sm text-ink-secondary mb-4">{module.description}</p>
              <div className="flex items-center gap-1 text-sm text-primary">
                Open <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
