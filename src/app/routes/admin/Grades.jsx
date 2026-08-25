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
import studentService from '../../../services/students'

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
  const [allStudents, setAllStudents] = useState([])
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
    const [subjData, examDataList, studentsData] = await Promise.all([
      subjectService.getAll(),
      examService.getExams(),
      studentService.getAll(),
    ])
    setSubjects(subjData || [])
    setExams(examDataList || [])
    setAllStudents(studentsData || [])
    setLoading(false)
  }

  const availableExams = exams.filter(e =>
    (!selectedClass || e.class?.includes(selectedClass)) &&
    (!selectedSection || e.section === selectedSection) &&
    (!selectedSubject || e.subject === selectedSubject)
  )

  const classStudents = allStudents.filter(s =>
    !selectedClass || s.class?.includes(selectedClass)
  )

  useEffect(() => {
    if (selectedExam) {
      loadGrades()
    } else {
      setStudentGrades([])
    }
  }, [selectedExam])

  const loadGrades = async () => {
    const existing = await examService.getGrades(selectedExam)
    const exam = exams.find(e => e.id === selectedExam)
    if (!exam) return

    const grades = classStudents.map(student => {
      const existingGrade = existing.find(g => g.studentId === student.id)
      return {
        studentId: student.id,
        studentName: student.name,
        marks: existingGrade?.marks || '',
        totalMarks: exam.totalMarks || 100,
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

  const currentExam = exams.find(e => e.id === selectedExam)

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
            {availableExams.map(e => <option key={e.id} value={e.id}>{`${e.name} (${e.subject})`}</option>)}
          </Select>
        </div>
      </Card>

      {/* Grade Entry Table */}
      {selectedExam && currentExam ? (
        <Card padding={false}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-ink">{currentExam.name} - {currentExam.subject}</h3>
              <p className="text-sm text-ink-secondary">Total Marks: {currentExam.totalMarks} | Date: {currentExam.date}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleSave}>
                <Save className="w-4 h-4" /> Save Grades
              </Button>
              <Button onClick={() => setPublishConfirm(true)}>
                <Upload className="w-4 h-4" /> Publish Results
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-app">
                  <th className="table-header">Student ID</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Marks (/{currentExam.totalMarks})</th>
                  <th className="table-header">Percentage</th>
                  <th className="table-header">Grade</th>
                </tr>
              </thead>
              <tbody>
                {studentGrades.map((g) => {
                  const numMarks = parseInt(g.marks) || 0
                  const pct = g.marks !== '' ? Math.round((numMarks / g.totalMarks) * 100) : '-'
                  return (
                    <tr key={g.studentId} className="border-b border-border last:border-0 hover:bg-surface-hover">
                      <td className="table-cell font-mono text-xs">{g.studentId}</td>
                      <td className="table-cell font-medium">{g.studentName}</td>
                      <td className="table-cell">
                        <input
                          type="number"
                          min="0"
                          max={g.totalMarks}
                          value={g.marks}
                          onChange={(e) => handleMarksChange(g.studentId, e.target.value)}
                          className="w-20 px-2 py-1 border border-border rounded text-sm text-center focus:outline-none focus:border-primary"
                          placeholder="0"
                        />
                      </td>
                      <td className="table-cell font-mono text-sm">{pct !== '-' ? `${pct}%` : '-'}</td>
                      <td className="table-cell">
                        {g.grade && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            g.grade.startsWith('A') ? 'bg-success-light text-success' :
                            g.grade.startsWith('B') ? 'bg-info-light text-info' :
                            g.grade === 'C' ? 'bg-warning-light text-warning' :
                            'bg-danger-light text-danger'
                          }`}>
                            {g.grade}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="Select an Exam"
          description="Choose a class, subject, and exam above to start entering grades."
        />
      )}

      {/* Publish Confirm */}
      <ConfirmDialog
        isOpen={publishConfirm}
        onClose={() => setPublishConfirm(false)}
        onConfirm={handlePublish}
        title="Publish Results"
        message="Are you sure you want to publish these results? Students will immediately be able to view their marks."
        confirmText="Publish"
      />
    </div>
  )
}
