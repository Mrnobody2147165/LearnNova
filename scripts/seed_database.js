import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dczknkgqgydgsmnbtfae.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjemtua2dxZ3lkZ3NtbmJ0ZmFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NzU0NjksImV4cCI6MjEwMzA1MTQ2OX0.SeFsNLpdy2N695hQyLuD2RiVhkiLcxIMWNf-l2WDv2A'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('🚀 Seeding Attendance, Homework & Notifications in Supabase...')

  const schoolId = '14bdc5cf-93da-4ee6-9e07-d4378a8cae84'
  const classId = '3a9be802-dfd0-4e6e-9989-db6d0b03f158'
  const sectionId = '55d1ca00-002a-4d4b-a96d-85b1897b92d2'
  const teacherId = '81c60a72-a785-45ba-9959-9c2b44ebb611'
  const subjectId = '6b6f539f-1605-49e9-bea8-e7d9dcd3f5ff'

  const { data: students } = await supabase.from('students').select('id, student_id_code, roll_number')

  // 1. Seed Attendance
  console.log('📦 Seeding Attendance Records...')
  const dates = ['2026-08-25', '2026-08-24', '2026-08-23', '2026-08-22', '2026-08-21', '2026-08-20']
  for (const st of students) {
    for (const d of dates) {
      try {
        await supabase.from('attendance_records').upsert([{
          school_id: schoolId,
          student_id: st.id,
          class_id: classId,
          section_id: sectionId,
          date: d,
          status: (d === '2026-08-22' && st.roll_number === '24') ? 'Late' : (d === '2026-08-20' && st.roll_number === '07') ? 'Absent' : 'Present',
          remarks: 'Recorded attendance',
        }], { onConflict: 'student_id,date' })
      } catch (e) {}
    }
  }
  console.log('✅ Attendance seeded.')

  // 2. Seed Homework
  console.log('📦 Seeding Homework...')
  const hwList = [
    {
      school_id: schoolId,
      class_id: classId,
      section_id: sectionId,
      subject_id: subjectId,
      teacher_id: teacherId,
      title: 'Algebra Quadratic Equations Exercises',
      description: 'Solve exercises 4.1 to 4.3 from textbook with step-by-step solutions.',
      due_date: '2026-08-30',
      status: 'Active',
    },
    {
      school_id: schoolId,
      class_id: classId,
      section_id: sectionId,
      subject_id: subjectId,
      teacher_id: teacherId,
      title: 'Newton Laws Numerical Problems',
      description: 'Calculate momentum and gravitational acceleration calculations on page 78.',
      due_date: '2026-08-28',
      status: 'Active',
    },
    {
      school_id: schoolId,
      class_id: classId,
      section_id: sectionId,
      subject_id: subjectId,
      teacher_id: teacherId,
      title: 'English Essay: Role of Youth in National Building',
      description: 'Write a 350-word structured essay detailing environmental changes and youth roles.',
      due_date: '2026-09-02',
      status: 'Active',
    },
  ]

  for (const hw of hwList) {
    try {
      await supabase.from('homework').insert([hw])
    } catch (e) {}
  }
  console.log('✅ Homework seeded.')

  // 3. Seed Notifications
  console.log('📦 Seeding Notifications...')
  try {
    await supabase.from('notifications').insert([
      {
        school_id: schoolId,
        recipient_type: 'student',
        title: 'August Fee Challan Issued',
        message: 'Your monthly fee challan for August 2026 is available. Due date is August 30.',
        notification_type: 'fee',
        action_link: '/student/fees',
        is_read: false,
      },
      {
        school_id: schoolId,
        recipient_type: 'student',
        title: 'New Homework Assigned',
        message: 'Algebra Quadratic Equations Exercises due August 30.',
        notification_type: 'homework',
        action_link: '/student/homework',
        is_read: false,
      },
    ])
  } catch (e) {}
  console.log('✅ Notifications seeded.')

  console.log('🎉 Full Live Supabase Seeding Done!')
}

seed().catch(console.error)
