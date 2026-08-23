import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Circle, Clock } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Tabs from '../../../components/ui/Tabs'
import Button from '../../../components/ui/Button'
import LoadingState from '../../../components/ui/LoadingState'
import StatusBadge from '../../../components/ui/StatusBadge'
import { studentSubjects, studentGrades, homework, homeworkSubmissions, exams } from '../../../data/academics'
import { formatDateShort } from '../../../utils/format'

export default function StudentSubjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [subject, setSubject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSubject(studentSubjects.find(s => s.id === id) || null)
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [id])

  if (loading) return <LoadingState />
  if (!subject) return <div className="text-center py-16 text-ink-secondary">Subject not found</div>

  const subjectGrades = studentGrades.filter(g => g.subjectId === id)
  const subjectExams = exams.filter(e => e.subjectId === id)
  const subjectHomework = homework.filter(h => h.subjectId === id).map(h => {
    const sub = homeworkSubmissions.find(s => s.homeworkId === h.id && s.studentId === 'STU-2026-00124')
    return { ...h, submissionStatus: sub?.status || 'Pending' }
  })

  const completedTopics = subject.topics.filter(t => t.completed).length

  return (
    <div>
      <button onClick={() => navigate('/student/subjects')} className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Subjects
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">{subject.name}</h1>
        <p className="text-sm text-ink-secondary mt-1">{subject.teacher}</p>
      </div>

      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'homework', label: 'Homework' },
          { id: 'grades', label: 'Grades' },
          { id: 'exams', label: 'Exams' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <p className="text-2xl font-semibold text-success">{subject.progress}%</p>
            <p className="text-sm text-ink-secondary mt-1">Progress</p>
          </Card>
          <Card>
            <p className="text-2xl font-semibold text-ink">{completedTopics} / {subject.topics.length}</p>
            <p className="text-sm text-ink-secondary mt-1">Topics Completed</p>
          </Card>
          <Card>
            <p className="text-2xl font-semibold text-ink">{subject.average}%</p>
            <p className="text-sm text-ink-secondary mt-1">Average Grade</p>
          </Card>
          <Card>
            <p className="text-2xl font-semibold text-ink">{subject.attendance}%</p>
            <p className="text-sm text-ink-secondary mt-1">Attendance</p>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-4">
            <h3 className="text-base font-semibold text-ink mb-4">Topics</h3>
            <div className="space-y-2">
              {subject.topics.map((topic, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-btn bg-surface-app">
                  {topic.completed ? (
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  ) : topic.inProgress ? (
                    <Clock className="w-5 h-5 text-warning flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-ink-muted flex-shrink-0" />
                  )}
                  <span className={`text-sm ${topic.completed ? 'text-ink' : topic.inProgress ? 'text-warning' : 'text-ink-muted'}`}>
                    {topic.name}
                    {topic.inProgress && ' (In Progress)'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'homework' && (
        <div className="space-y-3">
          {subjectHomework.length === 0 ? (
            <Card><p className="text-sm text-ink-muted text-center py-4">No homework for this subject</p></Card>
          ) : subjectHomework.map(hw => (
            <Card key={hw.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/student/homework/${hw.id}`)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{hw.title}</p>
                  <p className="text-xs text-ink-muted mt-1">Due {formatDateShort(hw.dueDate)}</p>
                </div>
                <StatusBadge status={hw.submissionStatus === 'Pending' ? 'Pending' : hw.submissionStatus} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'grades' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Assessment</th>
                  <th className="table-header">Score</th>
                  <th className="table-header">Grade</th>
                </tr>
              </thead>
              <tbody>
                {subjectGrades.length > 0 ? subjectGrades.map(g => (
                  <tr key={g.subjectId} className="border-b border-border last:border-0">
                    <td className="table-cell font-medium">Monthly Exam</td>
                    <td className="table-cell">{g.monthlyExam}%</td>
                    <td className="table-cell"><StatusBadge status={g.overall >= 90 ? 'Active' : 'Completed'} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" className="table-cell text-center text-ink-muted py-4">No grades available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'exams' && (
        <div className="space-y-3">
          {subjectExams.length === 0 ? (
            <Card><p className="text-sm text-ink-muted text-center py-4">No exams for this subject</p></Card>
          ) : subjectExams.map(exam => (
            <Card key={exam.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{exam.name}</p>
                  <p className="text-xs text-ink-muted mt-1">{formatDateShort(exam.date)} • {exam.startTime} • {exam.totalMarks} marks</p>
                </div>
                <StatusBadge status={exam.status === 'Completed' ? 'Completed' : 'Pending'} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
