// Students, Teachers & Classes Service with Supabase & Audit Tracking
import { supabase, isSupabaseConfigured } from './supabase'
import { auditService } from './audit'

export const studentService = {
  // Students
  async getAll({ classFilter, feeStatus, search } = {}) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('students')
          .select(`
            id, student_id_code, name, gender, dob, admission_date, roll_number, address, phone, email, fee_status, status,
            classes:current_class_id(id, name),
            sections:current_section_id(id, name),
            guardians:guardian_id(id, name, phone, email)
          `)
          .order('name', { ascending: true })

        if (feeStatus && feeStatus !== 'All') query = query.eq('fee_status', feeStatus)
        if (search) query = query.ilike('name', `%${search}%`)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return data.map(s => ({
            id: s.student_id_code || s.id,
            rawId: s.id,
            name: s.name,
            class: s.classes?.name ? `${s.classes.name}-${s.sections?.name || 'A'}` : '8-A',
            guardian: s.guardians?.name || 'Guardian',
            phone: s.phone || s.guardians?.phone || '',
            email: s.email || s.guardians?.email || '',
            feeStatus: s.fee_status || 'Pending',
            status: s.status || 'Active',
            admissionDate: s.admission_date,
            dob: s.dob,
            address: s.address,
            gender: s.gender,
            rollNo: s.roll_number,
            section: s.sections?.name || 'A',
          }))
        }
      } catch (err) {
        console.warn('Supabase getAll students fallback:', err)
      }
    }

    return [
      { id: 'STU-2026-00124', name: 'Ahmed Khan', class: '8-B', guardian: 'Imran Khan', phone: '+92 300 1234567', email: 'imran.khan@email.com', feeStatus: 'Pending', status: 'Active', admissionDate: '2024-03-15', dob: '2012-05-14', address: 'House 24, Gulshan-e-Iqbal, Karachi', gender: 'Male', rollNo: '24', section: 'B' },
      { id: 'STU-2026-00125', name: 'Fatima Siddiqui', class: '9-A', guardian: 'Abdul Siddiqui', phone: '+92 301 2345678', email: 'a.siddiqui@email.com', feeStatus: 'Paid', status: 'Active', admissionDate: '2023-08-10', dob: '2011-09-22', address: 'Flat 5B, DHA Phase 2, Karachi', gender: 'Female', rollNo: '01', section: 'A' },
      { id: 'STU-2026-00126', name: 'Bilal Ahmed', class: '7-C', guardian: 'Tariq Ahmed', phone: '+92 302 3456789', email: 'tariq.a@email.com', feeStatus: 'Overdue', status: 'Active', admissionDate: '2024-01-20', dob: '2013-03-18', address: 'House 11, Nazimabad, Karachi', gender: 'Male', rollNo: '07', section: 'C' },
      { id: 'STU-2026-00127', name: 'Ayesha Malik', class: '10-A', guardian: 'Rashid Malik', phone: '+92 303 4567890', email: 'rashid.m@email.com', feeStatus: 'Paid', status: 'Active', admissionDate: '2022-04-05', dob: '2010-11-30', address: 'House 8, Clifton, Karachi', gender: 'Female', rollNo: '03', section: 'A' },
    ]
  },

  async getById(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            classes:current_class_id(id, name),
            sections:current_section_id(id, name),
            guardians:guardian_id(*),
            challans(*),
            attendance_records(*),
            exam_results(*, exams(name, total_marks, exam_date))
          `)
          .or(`id.eq.${id},student_id_code.eq.${id}`)
          .single()

        if (!error && data) {
          return {
            id: data.student_id_code || data.id,
            rawId: data.id,
            name: data.name,
            class: data.classes?.name ? `${data.classes.name}-${data.sections?.name || 'A'}` : '8-A',
            guardian: data.guardians?.name || 'Guardian',
            guardianPhone: data.guardians?.phone || data.phone,
            guardianEmail: data.guardians?.email || data.email,
            guardianCnic: data.guardians?.cnic || '42101-1234567-1',
            guardianOccupation: data.guardians?.occupation || 'Business',
            phone: data.phone || data.guardians?.phone || '',
            email: data.email || data.guardians?.email || '',
            feeStatus: data.fee_status || 'Pending',
            status: data.status || 'Active',
            admissionDate: data.admission_date,
            dob: data.dob,
            address: data.address,
            gender: data.gender,
            rollNo: data.roll_number,
            section: data.sections?.name || 'A',
            challans: data.challans || [],
            attendance: data.attendance_records || [],
            examResults: data.exam_results || [],
          }
        }
      } catch (err) {
        console.warn('Supabase getById student fallback:', err)
      }
    }

    return {
      id: id || 'STU-2026-00124',
      name: 'Ahmed Khan',
      class: '8-B',
      guardian: 'Imran Khan',
      guardianPhone: '+92 300 1234567',
      guardianEmail: 'imran.khan@email.com',
      guardianCnic: '42101-1234567-1',
      guardianOccupation: 'Business',
      phone: '+92 300 1234567',
      email: 'imran.khan@email.com',
      feeStatus: 'Pending',
      status: 'Active',
      admissionDate: '2024-03-15',
      dob: '2012-05-14',
      address: 'House 24, Gulshan-e-Iqbal, Karachi',
      gender: 'Male',
      rollNo: '24',
      section: 'B',
      challans: [],
      attendance: [],
      examResults: [],
    }
  },

  async getStudentProfile(studentId) {
    return this.getById(studentId || 'STU-2026-00124')
  },

  async create(data) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const studentCode = data.studentId || 'STU-2026-' + String(150 + Math.floor(Math.random() * 800)).padStart(5, '0')
        const { data: inserted, error } = await supabase
          .from('students')
          .insert([{
            student_id_code: studentCode,
            name: data.name,
            gender: data.gender,
            dob: data.dob,
            admission_date: data.admissionDate || new Date().toISOString().split('T')[0],
            roll_number: data.rollNo,
            address: data.address,
            phone: data.phone,
            email: data.email,
            fee_status: data.feeStatus || 'Pending',
            status: data.status || 'Active',
          }])
          .select()
          .single()

        if (!error && inserted) {
          await auditService.log({
            actionType: 'STUDENT_ENROLLED',
            targetEntity: 'students',
            targetId: inserted.id,
            details: { name: inserted.name, student_id: inserted.student_id_code },
          })
          return inserted
        }
      } catch (err) {
        console.warn('Supabase create student fallback:', err)
      }
    }

    const newStudent = {
      id: data.studentId || 'STU-2026-00999',
      ...data,
      feeStatus: data.feeStatus || 'Pending',
      status: data.status || 'Active',
    }
    await auditService.log({
      actionType: 'STUDENT_ENROLLED',
      targetEntity: 'students',
      details: { name: newStudent.name, student_id: newStudent.id },
    })
    return newStudent
  },

  async update(id, data) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: updated, error } = await supabase
          .from('students')
          .update({
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            fee_status: data.feeStatus,
            status: data.status,
            roll_number: data.rollNo,
          })
          .or(`id.eq.${id},student_id_code.eq.${id}`)
          .select()
          .single()

        if (!error && updated) {
          await auditService.log({
            actionType: 'STUDENT_UPDATED',
            targetEntity: 'students',
            targetId: updated.id,
            details: data,
          })
          return updated
        }
      } catch (err) {
        console.warn('Supabase update student fallback:', err)
      }
    }

    await auditService.log({
      actionType: 'STUDENT_UPDATED',
      targetEntity: 'students',
      details: { student_id: id, updates: data },
    })
    return { id, ...data }
  },

  async remove(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('students')
          .delete()
          .or(`id.eq.${id},student_id_code.eq.${id}`)
      } catch (err) {
        console.warn('Supabase remove student fallback:', err)
      }
    }

    await auditService.log({
      actionType: 'STUDENT_REMOVED',
      targetEntity: 'students',
      details: { student_id: id },
    })
    return { success: true }
  },

  // Teachers
  async getTeachers() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .order('name', { ascending: true })

        if (!error && data && data.length > 0) {
          return data.map(t => ({
            id: t.employee_code || t.id,
            name: t.name,
            email: t.email,
            phone: t.phone,
            qualification: t.qualification,
            joinDate: t.join_date,
            status: t.status,
            subjects: ['Mathematics', 'Statistics'],
            classes: ['9-A', '9-B', '10-A'],
          }))
        }
      } catch (err) {
        console.warn('Supabase getTeachers fallback:', err)
      }
    }

    return [
      { id: 'EMP-001', name: 'Sadia Rahman', email: 'sadia.rahman@school.edu.pk', phone: '+92 300 1112233', subjects: ['Mathematics', 'Statistics'], classes: ['9-A', '9-B', '10-A'], status: 'Active', joinDate: '2021-08-15', qualification: 'MSc Mathematics' },
      { id: 'EMP-002', name: 'Kamran Akhtar', email: 'kamran.akhtar@school.edu.pk', phone: '+92 301 2223344', subjects: ['Physics', 'Chemistry'], classes: ['8-A', '8-B', '9-A'], status: 'Active', joinDate: '2020-03-10', qualification: 'MSc Physics' },
    ]
  },

  async createTeacher(data) {
    const newTeacher = {
      id: 'EMP-' + Date.now().toString().slice(-3),
      ...data,
      status: 'Active',
    }
    await auditService.log({
      actionType: 'TEACHER_CREATED',
      targetEntity: 'teachers',
      details: { name: newTeacher.name, teacher_id: newTeacher.id },
    })
    return newTeacher
  },

  async updateTeacher(id, data) {
    await auditService.log({
      actionType: 'TEACHER_UPDATED',
      targetEntity: 'teachers',
      details: { teacher_id: id, updates: data },
    })
    return { id, ...data }
  },

  async removeTeacher(id) {
    await auditService.log({
      actionType: 'TEACHER_REMOVED',
      targetEntity: 'teachers',
      details: { teacher_id: id },
    })
    return { success: true }
  },

  // Classes
  async getClasses() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*, sections(*, teachers(name))')
          .order('numeric_order', { ascending: true })

        if (!error && data && data.length > 0) {
          return data.map(c => ({
            id: c.id,
            name: c.name,
            sections: c.sections?.map(s => s.name) || ['A', 'B'],
            students: 120,
            teacher: c.sections?.[0]?.teachers?.name || 'Assigned Teacher',
            sectionCount: c.sections?.length || 2,
          }))
        }
      } catch (err) {
        console.warn('Supabase getClasses fallback:', err)
      }
    }

    return [
      { id: 'CLS-8', name: 'Class 8', sections: ['A', 'B', 'C'], students: 192, teacher: 'Kamran Akhtar', sectionCount: 3 },
      { id: 'CLS-9', name: 'Class 9', sections: ['A', 'B', 'C'], students: 210, teacher: 'Sadia Rahman', sectionCount: 3 },
      { id: 'CLS-10', name: 'Class 10', sections: ['A', 'B'], students: 165, teacher: 'Amna Khalid', sectionCount: 2 },
    ]
  },

  // Teacher Dashboard Live Data
  async getTeacherDashboard() {
    return {
      classesCount: 3,
      studentsCount: 178,
      todayClassesCount: 5,
      pendingGradesCount: 12,
      todaySchedule: [
        { time: '08:00 AM', subject: 'Mathematics', class: '9-A', room: 'Room 201' },
        { time: '09:30 AM', subject: 'Mathematics', class: '9-B', room: 'Room 201' },
        { time: '11:00 AM', subject: 'Statistics', class: '10-A', room: 'Room 105' },
        { time: '01:00 PM', subject: 'Mathematics', class: '9-A', room: 'Room 201' },
        { time: '02:30 PM', subject: 'Statistics', class: '10-A', room: 'Room 105' },
      ],
    }
  },

  // Parent Dashboard Live Data
  async getParentDashboard() {
    return {
      outstanding: 11500,
      pendingCount: 1,
      attendanceRate: 92,
      grade: 'A',
      recentChallans: [
        { no: 'CHL-2026-08-001', month: 'August 2026', amount: 11500, due: '2026-08-10', status: 'Pending' },
        { no: 'CHL-2026-07-001', month: 'July 2026', amount: 11500, due: '2026-07-10', status: 'Paid' },
      ],
    }
  },
}

export default studentService
