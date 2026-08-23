import { useState, useEffect } from 'react'
import { Save, Upload, GraduationCap } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import { useToast } from '../../../components/ui/Toast'
import examService from '../../../services/exams'
import subjectService from '../../../services/subjects'
import { subjects as subjectData, exams as examData, grades as gradeData } from '../../../data/academics'
import { students as studentData } from '../../../data/students'

const calcGrade = (marks, total) => {
  const pct = (marks / total) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  return 'F'
}

export default function Grades() {
  const toast = useToast()
  const [subjects, setSubjects] = useState([])
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('A')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [studentGrades, setStudentGrades] = useState([])
  const [publishConfirm, setPublishConfirm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [subjData, examDataList] = await Promise.all([subjectService.getAll(), examService.getAll()])
    setSubjects(subjData)
    setExams(examDataList)
    setLoading(false)
  }

  const availableExams = exams.filter(e =>
    (!selectedClass || e.class === selectedClass) &&
    (!selectedSection || e.section === selectedSection) &&
    (!selectedSubject || e.subject === selectedSubject)
  )

  const classStudents = studentData.filter(s => s.class === `${selectedClass}-${selectedSection}`)

  useEffect(() => {
    if (selectedExam) {
      loadGrades()
    } else {
      setStudentGrades([])
    }
  }, [selectedExam])

  const loadGrades = async () => {
    const existing = gradeData.filter(g => g.examId === selectedExam)
    const exam = exams.find(e => e.id === selectedExam)
    if (!exam) return

    const grades = classStudents.map(student => {
      const existingGrade = existing.find(g => g.studentId === student.id)
      return {
        studentId: student.id,
        studentName: student.name,
        marks: existingGrade?.marks || '',
        totalMarks: exam.totalMarks,
        grade: existingGrade?.grade || '',
      }
    })
    setStudentGrades(grades)
  }

  const handleMarksChange = (studentId, marks) => {
    setStudentGrades(prev => prev.map(g => {
      if (g.studentId === studentId) {
        const numMarks = parseInt(marks) || 0
        return {
          ...g,
          marks: marks,
          grade: marks ? calcGrade(numMarks, g.totalMarks) : '',
        }
      }
      return g
    }))
  }

  const handleSave = async () => {
    const validGrades = studentGrades.filter(g => g.marks !== '' && g.marks >= 0)
    if (validGrades.length === 0) {
      toast.error('Please enter marks for at least one student')
      return
    }
    try {
      await examService.saveGrades(selectedExam, validGrades)
      toast.success('Grades saved successfully.')
    } catch {
      toast.error('Failed to save grades')
    }
  }

  const handlePublish = async () => {
    try {
      await examService.publishResults(selectedExam)
      toast.success('Results published. Students can now view their results.')
    } catch {
      toast.error('Failed to publish results')
    }
    setPublishConfirm(false)
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader title="Grade Management" subtitle="Enter and publish exam results" />

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select label="Class" value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedExam('') }}>
            <option value="">Select class</option>
            {['6','7','8','9','10'].map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
          </Select>
          <Select label="Section" value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value); setSelectedExam('') }}>
            {['A','B','C'].map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select label="Subject" value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setSelectedExam('') }}>
            <option value="">All subjects</option>
            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </Select>
          <Select label="Exam" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
            <option value="">Select exam</option>
            {availableExams.map(e => <option key={e.id} value={e.id}>{e.name} — {e.subject}</option>)}
          </Select>
        </div>
      </Card>

      {!selectedExam ? (
        <EmptyState icon={GraduationCap} title="Select an exam" description="Choose a class, section, and exam to enter grades" />
      ) : classStudents.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students found" description="No students in this class and section" />
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-ink">Enter Grades</h3>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={handleSave}>
                  <Save className="w-4 h-4" /> Save Grades
                </Button>
                <Button onClick={() => setPublishConfirm(true)}>
                  <Upload className="w-4 h-4" /> Publish Results
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header">Student</th>
                    <th className="table-header">Student ID</th>
                    <th className="table-header">Marks</th>
                    <th className="table-header">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {studentGrades.map((g, i) => (
                    <tr key={g.studentId} className="border-b border-border last:border-0">
                      <td className="table-cell font-medium">{g.studentName}</td>
                      <td className="table-cell text-ink-secondary">{g.studentId}</td>
                      <td className="table-cell">
                        <input
                          type="number"
                          value={g.marks}
                          onChange={(e) => handleMarksChange(g.studentId, e.target.value)}
                          placeholder="0"
                          max={g.totalMarks}
                          min="0"
                          className="w-20 px-2 py-1 text-sm border border-border rounded-btn focus:border-primary focus:outline-none"
                        />
                        <span className="text-xs text-ink-muted ml-1">/ {g.totalMarks}</span>
                      </td>
                      <td className="table-cell">
                        {g.grade && (
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                            g.grade.startsWith('A') ? 'bg-success-bg text-success' :
                            g.grade.startsWith('B') ? 'bg-primary-light text-primary' :
                            'bg-warning-bg text-warning'
                          }`}>
                            {g.grade}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={publishConfirm}
        onClose={() => setPublishConfirm(false)}
        onConfirm={handlePublish}
        title="Publish Results"
        message="Once published, results will be visible to students in their portal. Make sure all grades are saved. Continue?"
        confirmLabel="Publish"
        danger={false}
      />
    </div>
  )
}
