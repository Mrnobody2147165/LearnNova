import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, CheckCircle, Clock } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../../components/ui/StatusBadge'
import LoadingState from '../../../components/ui/LoadingState'
import { useToast } from '../../../components/ui/Toast'
import homeworkService from '../../../services/homework'
import { homework as homeworkData, homeworkSubmissions } from '../../../data/academics'
import { formatDate } from '../../../utils/format'

export default function StudentHomeworkDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [hw, setHw] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = homeworkData.find(h => h.id === id)
      const sub = homeworkSubmissions.find(s => s.homeworkId === id && s.studentId === 'STU-2026-00124')
      setHw(found)
      setSubmission(sub || { status: 'Pending', submittedAt: null, fileName: null })
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [id])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  const handleSubmit = async () => {
    if (!fileName) {
      toast.error('Please upload a file first')
      return
    }
    setSubmitting(true)
    try {
      const result = await homeworkService.submit(id, 'STU-2026-00124', fileName)
      setSubmission(result)
      toast.success('Submitted successfully.')
    } catch {
      toast.error('Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState />
  if (!hw) return <div className="text-center py-16 text-ink-secondary">Homework not found</div>

  const isSubmitted = submission.status === 'Submitted' || submission.status === 'Graded'

  return (
    <div>
      <button onClick={() => navigate('/student/homework')} className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Homework
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-primary bg-primary-light px-2 py-0.5 rounded-full">{hw.subject}</span>
          <StatusBadge status={submission.status === 'Pending' ? 'Pending' : submission.status} />
        </div>
        <h1 className="text-2xl font-semibold text-ink">{hw.title}</h1>
        <p className="text-sm text-ink-secondary mt-1">Teacher: {hw.teacher}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Description */}
        <Card className="lg:col-span-2">
          <h3 className="text-base font-semibold text-ink mb-3">Description</h3>
          <p className="text-sm text-ink-secondary leading-relaxed">{hw.description}</p>

          <div className="mt-4 p-3 rounded-btn bg-surface-app border border-border">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-ink-secondary">Due Date:</span>
              <span className="font-medium text-ink">{formatDate(hw.dueDate)}</span>
            </div>
          </div>

          {/* Feedback if graded */}
          {submission.status === 'Graded' && submission.feedback && (
            <div className="mt-4 p-3 rounded-btn bg-success-bg border border-success/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">Teacher Feedback</span>
              </div>
              <p className="text-sm text-ink-secondary">{submission.feedback}</p>
              {submission.grade && <p className="text-sm font-semibold text-ink mt-1">Grade: {submission.grade}</p>}
            </div>
          )}
        </Card>

        {/* Submission */}
        <Card>
          <h3 className="text-base font-semibold text-ink mb-3">Submission</h3>

          {isSubmitted ? (
            <div className="space-y-3">
              <div className="p-3 rounded-btn bg-success-bg flex items-center gap-3">
                <FileText className="w-5 h-5 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{submission.fileName}</p>
                  <p className="text-xs text-ink-muted">Submitted on {submission.submittedAt ? formatDate(submission.submittedAt) : ''}</p>
                </div>
              </div>
              <p className="text-sm text-ink-secondary text-center">Your homework has been submitted.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">Upload File</label>
                <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-btn border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                  <Upload className="w-6 h-6 text-ink-muted" />
                  <span className="text-sm text-ink-secondary">
                    {fileName ? fileName : 'Click to upload'}
                  </span>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
                {submitting ? 'Submitting...' : 'Submit Homework'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
