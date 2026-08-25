import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Circle, Clock } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Tabs from '../../../components/ui/Tabs'
import Button from '../../../components/ui/Button'
import LoadingState from '../../../components/ui/LoadingState'
import StatusBadge from '../../../components/ui/StatusBadge'
import subjectService from '../../../services/subjects'
import examService from '../../../services/exams'
import homeworkService from '../../../services/homework'
import { formatDateShort } from '../../../utils/format'

export default function StudentSubjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [subject, setSubject] = useState(null)
  const [grades, setGrades] = useState([])
  const [exams, setExams] = useState([])
  const [homeworkList, setHomeworkList] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    Promise.all([
      subjectService.getStudentSubjectById(id),
      examService.getStudentGrades(),
      examService.getExams(),
      homeworkService.getHomeworkList(),
      homeworkService.getSubmissions(),
    ]).then(([subData, grdData, exData, hwData, subms]) => {
      setSubject(subData)
      setGrades(grdData?.filter(g => g.subjectId === id) || [])
      setExams(exData?.filter(e => e.subjectId === id || e.subject === subData?.name) || [])
      
      const mappedHw = (hwData || []).filter(h => h.subjectId === id || h.subject === subData?.name).map(h => {
        const sub = (subms || []).find(s => s.homeworkId === h.id)
        return { ...h, submissionStatus: sub?.status || 'Pending' }
      })
      setHomeworkList(mappedHw)
      setLoading(false)
    })
  }, [id])

  const toggleTopic = async (topicName, currentStatus) => {
    await subjectService.toggleTopicProgress(id, topicName, !currentStatus)
    const updated = await subjectService.getStudentSubjectById(id)
    setSubject({ ...updated })
  }

  if (loading) return <LoadingState />
  if (!subject) return <div className="text-center py-16 text-ink-secondary">Subject not found</div>

  const completedTopics = subject.topics ? subject.topics.filter(t => t.completed).length : 0
  const totalTopics = subject.topics ? subject.topics.length : 1
  const progressPct = Math.round((completedTopics / totalTopics) * 100)

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
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <span className="text-xs text-ink-muted">Syllabus Progress</span>
              <p className="text-xl font-bold text-ink mt-1">{progressPct}%</p>
              <div className="h-1.5 bg-surface-app rounded-full overflow-hidden mt-2">
                <div className="h-full bg-success rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
            </Card>
            <Card>
              <span className="text-xs text-ink-muted">Completed Topics</span>
              <p className="text-xl font-bold text-ink mt-1">{completedTopics} / {totalTopics}</p>
            </Card>
            <Card>
              <span className="text-xs text-ink-muted">Attendance Rate</span>
              <p className="text-xl font-bold text-success mt-1">{subject.attendance || 94}%</p>
            </Card>
          </div>

          <Card>
            <h3 className="text-base font-semibold text-ink mb-4">Curriculum Topics</h3>
            <div className="space-y-3">
              {(subject.topics || []).map((topic, i) => (
                <div
                  key={i}
                  onClick={() => toggleTopic(topic.name, topic.completed)}
                  className="flex items-center justify-between p-3 rounded-btn bg-surface-app hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {topic.completed ? (
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    ) : topic.inProgress ? (
                      <Clock className="w-5 h-5 text-warning flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-ink-muted flex-shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${topic.completed ? 'text-ink line-through text-opacity-60' : 'text-ink'}`}>
                      {topic.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-ink-muted">
                    {topic.completed ? 'Completed' : topic.inProgress ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'homework' && (
        <div className="space-y-3">
          {homeworkList.map(hw => (
            <Card key={hw.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/student/homework/${hw.id}`)}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-ink">{hw.title}</h4>
                  <p className="text-xs text-ink-muted mt-1">Due: {formatDateShort(hw.dueDate)}</p>
                </div>
                <StatusBadge status={hw.submissionStatus} />
              </div>
            </Card>
          ))}
          {homeworkList.length === 0 && <p className="text-sm text-ink-muted text-center py-8">No homework assigned yet for this subject.</p>}
        </div>
      )}

      {activeTab === 'grades' && (
        <Card>
          <div className="space-y-3">
            {grades.map((g, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-btn bg-surface-app">
                <span className="text-sm font-medium text-ink">Overall Average</span>
                <span className="text-base font-bold text-primary">{g.overall}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'exams' && (
        <div className="space-y-3">
          {exams.map(ex => (
            <Card key={ex.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-ink">{ex.name}</h4>
                  <p className="text-xs text-ink-muted mt-1">Date: {formatDateShort(ex.date)} • Total Marks: {ex.totalMarks}</p>
                </div>
                <StatusBadge status={ex.status} />
              </div>
            </Card>
          ))}
          {exams.length === 0 && <p className="text-sm text-ink-muted text-center py-8">No exams scheduled for this subject.</p>}
        </div>
      )}
    </div>
  )
}
