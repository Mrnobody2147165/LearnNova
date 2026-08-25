// Students Service with Supabase & Audit Tracking
import { supabase, isSupabaseConfigured } from './supabase'
import { auditService } from './audit'

const DEFAULT_SCHOOL_ID = '14bdc5cf-93da-4ee6-9e07-d4378a8cae84'

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''))

export const studentService = {
  async getAll({ classFilter, feeStatus, search } = {}) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('students')
          .select('*')
          .order('name', { ascending: true })

        if (feeStatus && feeStatus !== 'All' && feeStatus !== 'all') query = query.eq('fee_status', feeStatus)
        if (search) query = query.ilike('name', `%${search}%`)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          let results = data.map(s => ({
            id: s.student_id_code || s.id,
            rawId: s.id,
            name: s.name,
            class: s.roll_number ? `Class ${Math.floor(parseInt(s.roll_number || '24') % 5 + 6)}-${s.roll_number % 2 === 0 ? 'A' : 'B'}` : 'Class 8-A',
            guardian: s.email ? s.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Guardian',
            phone: s.phone || '+92 300 1234567',
            email: s.email || 'guardian@email.com',
            feeStatus: s.fee_status || 'Pending',
            status: s.status || 'Active',
            admissionDate: s.admission_date,
            dob: s.dob,
            address: s.address || 'Karachi, Pakistan',
            gender: s.gender || 'Male',
            rollNo: s.roll_number || '01',
            section: 'A',
          }))

          if (classFilter && classFilter !== 'all') {
            results = results.filter(s => s.class.toLowerCase().includes(classFilter.toLowerCase()))
          }
          return results
        }
      } catch (err) {
        console.warn('Supabase getAll students error:', err)
      }
    }
    return []
  },

  async getById(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('students')
          .select(`
            *,
            challans(*),
            attendance_records(*)
          `)

        if (isUUID(id)) {
          query = query.or(`id.eq.${id},student_id_code.eq.${id}`)
        } else {
          query = query.eq('student_id_code', id)
        }

        const { data, error } = await query.maybeSingle()

        if (!error && data) {
          return {
            id: data.student_id_code || data.id,
            rawId: data.id,
            name: data.name,
            class: `Class ${Math.floor(parseInt(data.roll_number || '24') % 5 + 6)}-A`,
            guardian: data.email ? data.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Imran Khan',
            guardianPhone: data.phone || '+92 300 1234567',
            guardianEmail: data.email || 'imran.khan@email.com',
            guardianCnic: '42101-1234567-1',
            guardianOccupation: 'Business',
            phone: data.phone || '+92 300 1234567',
            email: data.email || 'student@learnify.edu.pk',
            feeStatus: data.fee_status || 'Pending',
            status: data.status || 'Active',
            admissionDate: data.admission_date || '2024-03-15',
            dob: data.dob || '2012-05-14',
            address: data.address || 'Main Campus, Karachi',
            gender: data.gender || 'Male',
            rollNo: data.roll_number || '24',
            section: 'A',
            challans: data.challans || [],
            attendance: data.attendance_records || [],
          }
        }
      } catch (err) {
        console.warn('Supabase getById student error:', err)
      }
    }

    return null
  },

  async getStudentProfile(studentId) {
    const student = await this.getById(studentId || 'STU-2026-00124')
    if (student) return student
    const all = await this.getAll()
    return all.length > 0 ? all[0] : null
  },

  async create(data) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const studentCode = data.studentId || 'STU-2026-' + String(150 + Math.floor(Math.random() * 800)).padStart(5, '0')
        const { data: inserted, error } = await supabase
          .from('students')
          .insert([{
            school_id: DEFAULT_SCHOOL_ID,
            student_id_code: studentCode,
            name: data.name,
            gender: data.gender || 'Male',
            dob: data.dob || '2012-01-01',
            admission_date: data.admissionDate || new Date().toISOString().split('T')[0],
            roll_number: data.rollNo || '01',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
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
          return {
            id: inserted.student_id_code,
            rawId: inserted.id,
            name: inserted.name,
            class: data.class ? `Class ${data.class}` : 'Class 8-A',
            ...inserted,
          }
        }
      } catch (err) {
        console.warn('Supabase create student error:', err)
      }
    }

    return { id: data.studentId || 'STU-2026-00999', ...data }
  },

  async update(id, data) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
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

        if (isUUID(id)) {
          query = query.or(`id.eq.${id},student_id_code.eq.${id}`)
        } else {
          query = query.eq('student_id_code', id)
        }

        const { data: updated, error } = await query.select().maybeSingle()

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
        console.warn('Supabase update student error:', err)
      }
    }

    return { id, ...data }
  },

  async delete(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('students')
          .delete()

        if (isUUID(id)) {
          query = query.or(`id.eq.${id},student_id_code.eq.${id}`)
        } else {
          query = query.eq('student_id_code', id)
        }

        await query
      } catch (err) {
        console.warn('Supabase delete student error:', err)
      }
    }

    await auditService.log({
      actionType: 'STUDENT_DELETED',
      targetEntity: 'students',
      details: { student_id: id },
    })
    return { success: true }
  },

  async remove(id) {
    return this.delete(id)
  },

  async getStats() {
    const students = await this.getAll()
    const active = students.filter(s => s.status === 'Active').length
    const feePending = students.filter(s => s.feeStatus === 'Pending' || s.feeStatus === 'Overdue').length
    return {
      totalStudents: students.length,
      activeStudents: active,
      feePending,
    }
  },
}

export default studentService
