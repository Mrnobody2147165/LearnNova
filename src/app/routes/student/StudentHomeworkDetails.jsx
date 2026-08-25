import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, CheckCircle, Clock } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../../components/ui/StatusBadge'
import LoadingState from '../../../components/ui/LoadingState'
import { useToast } from '../../../components/ui/Toast'
import homeworkService from '../../../services/homework'
import { formatDate } from '../../../utils/format'

export default function StudentHomeworkDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [hw, setHw] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      homeworkService.getHomeworkById(id),
      homeworkService.getSubmissions(id),
    ]).then(([hwData, subs]) => {
      setHw(hwData)
      setSubmission(subs && subs.length > 0 ? subs[0] : null)
      setLoading(false)
    })
  }, [id])

  if (loading) return <LoadingState />
  if (!hw) return <div className="text-center py-16 text-ink-secondary">Homework not found</div>

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a file to upload')
      return
    }
    setSubmitting(true)
    const result = await homeworkService.submitHomework(id, 'STU-2026-00124', { fileName: file.name })
    setSubmission(result)
    setSubmitting(false)
    toast.success('Homework submitted successfully')
  }

  return (
    <div>
      <button onClick={() => navigate('/student/homework')} className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Homework
      </button>

      <PageHeader
        title={hw.title}
        subtitle={`${hw.subject} • Due ${formatDate(hw.dueDate)}`}
        actions={<StatusBadge status={submission?.status || 'Pending'} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-base font-semibold text-ink mb-3">Assignment Description</h3>
            <p className="text-sm text-ink-secondary whitespace-pre-line leading-relaxed">{hw.description}</p>
          </Card>

          {submission?.grade && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-ink">Evaluation & Feedback</h3>
                <span className="text-lg font-bold text-success">Grade: {submission.grade}</span>
              </div>
              <p className="text-sm text-ink-secondary italic bg-surface-app p-3 rounded-btn">"{submission.feedback}"</p>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <h3 className="text-base font-semibold text-ink mb-4">Your Submission</h3>
            {submission && submission.status !== 'Pending' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-btn bg-surface-app">
                  <FileText className="w-6 h-6 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{submission.fileName || 'submission.pdf'}</p>
                    <p className="text-xs text-ink-muted">Submitted on {formatDate(submission.submittedAt)}</p>
                  </div>
                </div>
                <StatusBadge status={submission.status} />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-card p-6 text-center hover:border-primary transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <Upload className="w-8 h-8 text-ink-muted mx-auto mb-2" />
                  <p className="text-sm font-medium text-ink">
                    {file ? file.name : 'Choose file or drag & drop'}
                  </p>
                  <p className="text-xs text-ink-muted mt-1">PDF, DOC, ZIP up to 10MB</p>
                </div>
                <Button type="submit" className="w-full" disabled={submitting || !file}>
                  {submitting ? 'Uploading...' : 'Submit Homework'}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
