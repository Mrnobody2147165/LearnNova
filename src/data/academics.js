export const subjects = [
  { id: 'SUB-1', name: 'Mathematics', code: 'MATH-101', teacher: 'Sadia Rahman', teacherId: 'EMP-001', classes: ['8-A', '8-B', '9-A', '9-B', '10-A'] },
  { id: 'SUB-2', name: 'Physics', code: 'PHY-101', teacher: 'Kamran Akhtar', teacherId: 'EMP-002', classes: ['8-A', '8-B', '9-A', '10-A'] },
  { id: 'SUB-3', name: 'Chemistry', code: 'CHM-101', teacher: 'Amna Khalid', teacherId: 'EMP-005', classes: ['9-A', '9-B', '10-A', '10-B'] },
  { id: 'SUB-4', name: 'English', code: 'ENG-101', teacher: 'Nadia Shirazi', teacherId: 'EMP-003', classes: ['8-A', '8-B', '8-C', '7-A', '7-B'] },
  { id: 'SUB-5', name: 'Computer Science', code: 'CS-101', teacher: 'Fahad Iqbal', teacherId: 'EMP-004', classes: ['8-A', '8-B', '6-A', '7-C'] },
  { id: 'SUB-6', name: 'Urdu', code: 'URD-101', teacher: 'Usman Ghani', teacherId: 'EMP-006', classes: ['8-A', '8-B', '7-A', '6-C'] },
  { id: 'SUB-7', name: 'Islamiyat', code: 'ISL-101', teacher: 'Usman Ghani', teacherId: 'EMP-006', classes: ['8-A', '8-B', '9-A', '10-A'] },
  { id: 'SUB-8', name: 'Pakistan Studies', code: 'PAK-101', teacher: 'Hina Pervaiz', teacherId: 'EMP-007', classes: ['9-A', '9-B', '10-A', '10-B'] },
]

export const exams = [
  { id: 'EX-1', name: 'August Monthly Examination', class: '8-A', section: 'A', subject: 'Mathematics', subjectId: 'SUB-1', date: '2026-08-25', startTime: '10:00', totalMarks: 100, description: 'Chapter 1–5', status: 'Scheduled', resultsPublished: false },
  { id: 'EX-2', name: 'August Monthly Examination', class: '8-A', section: 'A', subject: 'Physics', subjectId: 'SUB-2', date: '2026-08-27', startTime: '10:00', totalMarks: 100, description: 'Unit 1–3', status: 'Scheduled', resultsPublished: false },
  { id: 'EX-3', name: 'August Monthly Examination', class: '8-A', section: 'A', subject: 'English', subjectId: 'SUB-4', date: '2026-08-29', startTime: '10:00', totalMarks: 100, description: 'Chapters 1–4', status: 'Scheduled', resultsPublished: false },
  { id: 'EX-4', name: 'July Monthly Test', class: '8-A', section: 'A', subject: 'Mathematics', subjectId: 'SUB-1', date: '2026-07-20', startTime: '10:00', totalMarks: 50, description: 'Chapter 1–3', status: 'Completed', resultsPublished: true },
  { id: 'EX-5', name: 'July Monthly Test', class: '8-A', section: 'A', subject: 'Physics', subjectId: 'SUB-2', date: '2026-07-22', startTime: '10:00', totalMarks: 50, description: 'Unit 1–2', status: 'Completed', resultsPublished: true },
  { id: 'EX-6', name: 'July Monthly Test', class: '8-A', section: 'A', subject: 'English', subjectId: 'SUB-4', date: '2026-07-24', startTime: '10:00', totalMarks: 50, description: 'Chapters 1–2', status: 'Completed', resultsPublished: true },
  { id: 'EX-7', name: 'June Quiz', class: '8-A', section: 'A', subject: 'Computer Science', subjectId: 'SUB-5', date: '2026-06-15', startTime: '09:00', totalMarks: 25, description: 'Basics of Programming', status: 'Completed', resultsPublished: true },
]

export const grades = [
  { id: 'GRD-1', examId: 'EX-4', studentId: 'STU-2026-00124', studentName: 'Ahmed Khan', marks: 42, totalMarks: 50, grade: 'A' },
  { id: 'GRD-2', examId: 'EX-4', studentId: 'STU-2026-00129', studentName: 'Zainab Hussain', marks: 45, totalMarks: 50, grade: 'A+' },
  { id: 'GRD-3', examId: 'EX-4', studentId: 'STU-2026-00137', studentName: 'Noor Fatima', marks: 38, totalMarks: 50, grade: 'B+' },
  { id: 'GRD-4', examId: 'EX-4', studentId: 'STU-2026-00142', studentName: 'Faisal Mahmood', marks: 35, totalMarks: 50, grade: 'B' },
  { id: 'GRD-5', examId: 'EX-5', studentId: 'STU-2026-00124', studentName: 'Ahmed Khan', marks: 40, totalMarks: 50, grade: 'A' },
  { id: 'GRD-6', examId: 'EX-5', studentId: 'STU-2026-00129', studentName: 'Zainab Hussain', marks: 44, totalMarks: 50, grade: 'A+' },
  { id: 'GRD-7', examId: 'EX-5', studentId: 'STU-2026-00137', studentName: 'Noor Fatima', marks: 36, totalMarks: 50, grade: 'B+' },
  { id: 'GRD-8', examId: 'EX-6', studentId: 'STU-2026-00124', studentName: 'Ahmed Khan', marks: 46, totalMarks: 50, grade: 'A+' },
  { id: 'GRD-9', examId: 'EX-6', studentId: 'STU-2026-00129', studentName: 'Zainab Hussain', marks: 48, totalMarks: 50, grade: 'A+' },
  { id: 'GRD-10', examId: 'EX-7', studentId: 'STU-2026-00124', studentName: 'Ahmed Khan', marks: 23, totalMarks: 25, grade: 'A+' },
]

export const homework = [
  { id: 'HW-1', title: 'Algebra Worksheet', subject: 'Mathematics', subjectId: 'SUB-1', class: '8-A', section: 'A', teacher: 'Sadia Rahman', description: 'Complete questions 1–10 from Chapter 5. Show all working steps.', dueDate: '2026-08-25', status: 'Active', createdAt: '2026-08-18' },
  { id: 'HW-2', title: 'Numerical Problems', subject: 'Physics', subjectId: 'SUB-2', class: '8-A', section: 'A', teacher: 'Kamran Akhtar', description: 'Solve numerical problems 1–5 from Unit 2. Submit with proper formulas.', dueDate: '2026-08-24', status: 'Active', createdAt: '2026-08-17' },
  { id: 'HW-3', title: 'Essay: My Country', subject: 'English', subjectId: 'SUB-4', class: '8-A', section: 'A', teacher: 'Nadia Shirazi', description: 'Write a 500-word essay about Pakistan. Focus on culture and traditions.', dueDate: '2026-08-26', status: 'Active', createdAt: '2026-08-16' },
  { id: 'HW-4', title: 'Programming Exercise', subject: 'Computer Science', subjectId: 'SUB-5', class: '8-A', section: 'A', teacher: 'Fahad Iqbal', description: 'Write a simple program using loops. Print numbers 1 to 10.', dueDate: '2026-08-22', status: 'Active', createdAt: '2026-08-15' },
  { id: 'HW-5', title: 'Chapter 4 Review', subject: 'Mathematics', subjectId: 'SUB-1', class: '8-A', section: 'A', teacher: 'Sadia Rahman', description: 'Review exercises from Chapter 4. Prepare for quiz.', dueDate: '2026-08-10', status: 'Closed', createdAt: '2026-08-01' },
]

export const homeworkSubmissions = [
  { id: 'SUB-HW-1', homeworkId: 'HW-1', studentId: 'STU-2026-00124', studentName: 'Ahmed Khan', status: 'Pending', submittedAt: null, fileName: null },
  { id: 'SUB-HW-2', homeworkId: 'HW-2', studentId: 'STU-2026-00124', studentName: 'Ahmed Khan', status: 'Submitted', submittedAt: '2026-08-20', fileName: 'physics_numerical.pdf' },
  { id: 'SUB-HW-3', homeworkId: 'HW-3', studentId: 'STU-2026-00124', studentName: 'Ahmed Khan', status: 'Pending', submittedAt: null, fileName: null },
  { id: 'SUB-HW-4', homeworkId: 'HW-4', studentId: 'STU-2026-00124', studentName: 'Ahmed Khan', status: 'Graded', submittedAt: '2026-08-19', fileName: 'loops_program.py', grade: 'A', feedback: 'Good work! Clean code.' },
  { id: 'SUB-HW-5', homeworkId: 'HW-5', studentId: 'STU-2026-00124', studentName: 'Ahmed Khan', status: 'Graded', submittedAt: '2026-08-08', fileName: 'ch4_review.pdf', grade: 'A+', feedback: 'Excellent understanding of concepts.' },
  { id: 'SUB-HW-6', homeworkId: 'HW-1', studentId: 'STU-2026-00129', studentName: 'Zainab Hussain', status: 'Submitted', submittedAt: '2026-08-21', fileName: 'algebra_ws.pdf' },
  { id: 'SUB-HW-7', homeworkId: 'HW-4', studentId: 'STU-2026-00129', studentName: 'Zainab Hussain', status: 'Graded', submittedAt: '2026-08-18', fileName: 'loops.py', grade: 'A+', feedback: 'Perfect solution!' },
]

export const studentSubjects = [
  { id: 'SUB-1', name: 'Mathematics', teacher: 'Sadia Rahman', progress: 82, average: 87, homeworkCount: 3, examCount: 2, attendance: 94, topics: [
    { name: 'Algebra', completed: true },
    { name: 'Linear Equations', completed: true },
    { name: 'Geometry', completed: true },
    { name: 'Quadratic Equations', completed: false, inProgress: true },
    { name: 'Statistics', completed: false },
  ]},
  { id: 'SUB-2', name: 'Physics', teacher: 'Kamran Akhtar', progress: 78, average: 82, homeworkCount: 2, examCount: 2, attendance: 91, topics: [
    { name: 'Motion', completed: true },
    { name: 'Force', completed: true },
    { name: 'Energy', completed: true },
    { name: 'Waves', completed: false, inProgress: true },
    { name: 'Electricity', completed: false },
  ]},
  { id: 'SUB-4', name: 'English', teacher: 'Nadia Shirazi', progress: 91, average: 94, homeworkCount: 2, examCount: 2, attendance: 96, topics: [
    { name: 'Grammar', completed: true },
    { name: 'Comprehension', completed: true },
    { name: 'Essay Writing', completed: true },
    { name: 'Poetry', completed: true },
    { name: 'Literature', completed: false, inProgress: true },
  ]},
  { id: 'SUB-5', name: 'Computer Science', teacher: 'Fahad Iqbal', progress: 95, average: 96, homeworkCount: 3, examCount: 1, attendance: 98, topics: [
    { name: 'Programming Basics', completed: true },
    { name: 'Variables & Types', completed: true },
    { name: 'Conditionals', completed: true },
    { name: 'Loops', completed: true },
    { name: 'Functions', completed: true },
  ]},
]

export const studentGrades = [
  { subject: 'Mathematics', subjectId: 'SUB-1', quiz: 88, test: 84, monthlyExam: 91, overall: 87 },
  { subject: 'Physics', subjectId: 'SUB-2', quiz: 82, test: 79, monthlyExam: 85, overall: 82 },
  { subject: 'English', subjectId: 'SUB-4', quiz: 94, test: 91, monthlyExam: 96, overall: 94 },
  { subject: 'Computer Science', subjectId: 'SUB-5', quiz: 96, test: 95, monthlyExam: 97, overall: 96 },
]

export const studentAttendance = [
  { date: '2026-08-18', status: 'Present' },
  { date: '2026-08-17', status: 'Present' },
  { date: '2026-08-16', status: 'Late' },
  { date: '2026-08-15', status: 'Present' },
  { date: '2026-08-14', status: 'Present' },
  { date: '2026-08-13', status: 'Present' },
  { date: '2026-08-12', status: 'Present' },
  { date: '2026-08-11', status: 'Present' },
  { date: '2026-08-10', status: 'Late' },
  { date: '2026-08-09', status: 'Present' },
  { date: '2026-08-08', status: 'Present' },
  { date: '2026-08-07', status: 'Absent' },
  { date: '2026-08-06', status: 'Present' },
  { date: '2026-08-05', status: 'Present' },
  { date: '2026-08-04', status: 'Present' },
  { date: '2026-08-03', status: 'Present' },
  { date: '2026-08-02', status: 'Present' },
  { date: '2026-08-01', status: 'Present' },
  { date: '2026-07-31', status: 'Present' },
  { date: '2026-07-30', status: 'Present' },
]

export const studentSchedule = [
  { day: 'Monday', periods: [
    { time: '08:00', subject: 'Mathematics', teacher: 'Sadia Rahman', room: '201' },
    { time: '09:00', subject: 'Physics', teacher: 'Kamran Akhtar', room: '105' },
    { time: '10:00', subject: 'English', teacher: 'Nadia Shirazi', room: '203' },
    { time: '11:00', subject: 'Computer Science', teacher: 'Fahad Iqbal', room: 'Lab 1' },
    { time: '12:00', subject: 'Break', teacher: '', room: '' },
    { time: '13:00', subject: 'Urdu', teacher: 'Usman Ghani', room: '201' },
  ]},
  { day: 'Tuesday', periods: [
    { time: '08:00', subject: 'Physics', teacher: 'Kamran Akhtar', room: '105' },
    { time: '09:00', subject: 'Mathematics', teacher: 'Sadia Rahman', room: '201' },
    { time: '10:00', subject: 'Computer Science', teacher: 'Fahad Iqbal', room: 'Lab 1' },
    { time: '11:00', subject: 'English', teacher: 'Nadia Shirazi', room: '203' },
    { time: '12:00', subject: 'Break', teacher: '', room: '' },
    { time: '13:00', subject: 'Islamiyat', teacher: 'Usman Ghani', room: '201' },
  ]},
  { day: 'Wednesday', periods: [
    { time: '08:00', subject: 'English', teacher: 'Nadia Shirazi', room: '203' },
    { time: '09:00', subject: 'Computer Science', teacher: 'Fahad Iqbal', room: 'Lab 1' },
    { time: '10:00', subject: 'Mathematics', teacher: 'Sadia Rahman', room: '201' },
    { time: '11:00', subject: 'Physics', teacher: 'Kamran Akhtar', room: '105' },
    { time: '12:00', subject: 'Break', teacher: '', room: '' },
    { time: '13:00', subject: 'Urdu', teacher: 'Usman Ghani', room: '201' },
  ]},
  { day: 'Thursday', periods: [
    { time: '08:00', subject: 'Mathematics', teacher: 'Sadia Rahman', room: '201' },
    { time: '09:00', subject: 'English', teacher: 'Nadia Shirazi', room: '203' },
    { time: '10:00', subject: 'Physics', teacher: 'Kamran Akhtar', room: '105' },
    { time: '11:00', subject: 'Computer Science', teacher: 'Fahad Iqbal', room: 'Lab 1' },
    { time: '12:00', subject: 'Break', teacher: '', room: '' },
    { time: '13:00', subject: 'Islamiyat', teacher: 'Usman Ghani', room: '201' },
  ]},
  { day: 'Friday', periods: [
    { time: '08:00', subject: 'Computer Science', teacher: 'Fahad Iqbal', room: 'Lab 1' },
    { time: '09:00', subject: 'Mathematics', teacher: 'Sadia Rahman', room: '201' },
    { time: '10:00', subject: 'Physics', teacher: 'Kamran Akhtar', room: '105' },
    { time: '11:00', subject: 'English', teacher: 'Nadia Shirazi', room: '203' },
    { time: '12:00', subject: 'Break', teacher: '', room: '' },
    { time: '13:00', subject: 'Urdu', teacher: 'Usman Ghani', room: '201' },
  ]},
]

export const studentNotifications = [
  { id: 'SN-1', title: 'New Mathematics homework assigned', message: 'Algebra Worksheet has been assigned. Due August 25.', time: '2 hours ago', read: false, type: 'info', link: '/student/homework' },
  { id: 'SN-2', title: 'August Physics result published', message: 'Your Physics monthly exam result is now available.', time: '5 hours ago', read: false, type: 'success', link: '/student/exams' },
  { id: 'SN-3', title: 'Mathematics exam scheduled', message: 'August Monthly Exam for Mathematics on Aug 25 at 10:00 AM.', time: '1 day ago', read: false, type: 'warning', link: '/student/exams' },
  { id: 'SN-4', title: 'Attendance updated', message: 'Your attendance for this week has been updated.', time: '2 days ago', read: true, type: 'info', link: '/student/attendance' },
  { id: 'SN-5', title: 'Teacher feedback on homework', message: 'Fahad Iqbal left feedback on your Programming Exercise.', time: '3 days ago', read: true, type: 'success', link: '/student/homework' },
]

export const monthlyProgress = [
  { month: 'March', progress: 72 },
  { month: 'April', progress: 75 },
  { month: 'May', progress: 78 },
  { month: 'June', progress: 78 },
  { month: 'July', progress: 82 },
  { month: 'August', progress: 89 },
]
