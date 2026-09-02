// Students Service with Supabase & Audit Tracking
import { supabase, isSupabaseConfigured } from './supabase'
import { auditService } from './audit'

const DEFAULT_SCHOOL_ID = 'abc88e49-fa7c-4987-b877-09b05b61d6a6'

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''))

export const studentService = {
  async getAll({ classFilter, feeStatus, search } = {}) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('students')
          .select('*, classes:current_class_id(id, name)')
          .order('name', { ascending: true })

        if (feeStatus && feeStatus !== 'All' && feeStatus !== 'all') query = query.eq('fee_status', feeStatus)
        if (search) query = query.ilike('name', `%${search}%`)

        const { data, error } = await query
        if (error) {
          console.warn('Supabase getAll students error:', error.message)
        } else if (data) {
          let results = data.map(s => ({
            id: s.student_id_code || s.id,
            rawId: s.id,
            name: s.name,
            class: s.classes?.name || (s.roll_number ? `Class ${s.roll_number}` : 'Unassigned'),
            guardian: s.email ? s.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Guardian',
            phone: s.phone || '',
            email: s.email || '',
            feeStatus: s.fee_status || 'Pending',
            status: s.status || 'Active',
            admissionDate: s.admission_date,
            dob: s.dob,
            address: s.address || '',
            gender: s.gender || 'Male',
            rollNo: s.roll_number || '',
            section: s.section || 'A',
          }))

          if (classFilter && classFilter !== 'all') {
            results = results.filter(s => {
              const cls = String(s.class || '').toLowerCase()
              const filter = String(classFilter).toLowerCase()
              // Match "Class 1" filter against "class 1" — exact number match, not substring
              // e.g. filter "1" should match "class 1" but NOT "class 10" or "class 11"
              return cls === `class ${filter}` || cls === filter || new RegExp(`\\bclass\\s+${filter}\\b`).test(cls)
            })
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
            classes:current_class_id(id, name),
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
            class: data.classes?.name || (data.roll_number ? `Class ${data.roll_number}` : 'Unassigned'),
            guardian: data.email ? data.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Guardian',
            guardianPhone: data.phone || '',
            guardianEmail: data.email || '',
            guardianCnic: '',
            guardianOccupation: '',
            phone: data.phone || '',
            email: data.email || '',
            feeStatus: data.fee_status || 'Pending',
            status: data.status || 'Active',
            admissionDate: data.admission_date || '',
            dob: data.dob || '',
            address: data.address || '',
            gender: data.gender || 'Male',
            rollNo: data.roll_number || '',
            section: data.section || 'A',
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
        const className = data.class ? `Class ${data.class}` : (data.className || '')

        // Try to resolve current_class_id from the classes table
        let currentClassId = null
        if (data.class) {
          const { data: classRows } = await supabase
            .from('classes')
            .select('id, name')
            .eq('school_id', DEFAULT_SCHOOL_ID)
          if (classRows && classRows.length > 0) {
            const targetNum = String(data.class).replace(/[^0-9]/g, '')
            const match = classRows.find(c => {
              const cNum = String(c.name).replace(/[^0-9]/g, '')
              return (
                c.name === className ||
                c.name === `Class ${data.class}` ||
                c.name === String(data.class) ||
                cNum === targetNum
              )
            })
            if (match) currentClassId = match.id
          }
        }

        const insertPayload = {
          school_id: DEFAULT_SCHOOL_ID,
          student_id_code: studentCode,
          name: data.name,
          gender: data.gender || 'Male',
          dob: data.dob || null,
          admission_date: data.admissionDate || new Date().toISOString().split('T')[0],
          roll_number: data.rollNo || (data.class ? String(data.class).replace(/[^0-9]/g, '') : ''),
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          fee_status: data.feeStatus || 'Pending',
          status: data.status || 'Active',
        }
        if (currentClassId) insertPayload.current_class_id = currentClassId

        const { data: inserted, error } = await supabase
          .from('students')
          .insert([insertPayload])
          .select()
          .single()

        if (!error && inserted) {
          await auditService.log({
            actionType: 'STUDENT_ENROLLED',
            targetEntity: 'students',
            targetId: inserted.id,
            details: { name: inserted.name, student_id: inserted.student_id_code, class: className },
          })
          return {
            id: inserted.student_id_code || inserted.id,
            rawId: inserted.id,
            name: inserted.name,
            class: className,
            phone: inserted.phone || '',
            email: inserted.email || '',
            feeStatus: inserted.fee_status || 'Pending',
            status: inserted.status || 'Active',
            rollNo: inserted.roll_number || '',
            section: data.section || 'A',
            gender: inserted.gender || 'Male',
            address: inserted.address || '',
            admissionDate: inserted.admission_date,
          }
        }
        if (error) {
          console.error('Supabase create student error:', error.message)
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
        const updatePayload = {
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          fee_status: data.feeStatus,
          status: data.status,
          roll_number: data.rollNo,
          gender: data.gender,
        }
        if (data.dob) updatePayload.dob = data.dob

        // Try to resolve current_class_id if class is provided
        if (data.class) {
          const { data: classRows } = await supabase
            .from('classes')
            .select('id, name')
            .eq('school_id', DEFAULT_SCHOOL_ID)
          if (classRows && classRows.length > 0) {
            const target = `Class ${data.class}`
            const match = classRows.find(c =>
              c.name === target ||
              c.name === String(data.class) ||
              String(c.name).replace(/[^0-9]/g, '') === String(data.class)
            )
            if (match) updatePayload.current_class_id = match.id
          }
        }

        let query = supabase.from('students').update(updatePayload)

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
