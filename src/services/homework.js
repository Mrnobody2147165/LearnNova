// Homework Service with Supabase & Audit Tracking
import { supabase, isSupabaseConfigured } from './supabase'
import { auditService } from './audit'

export const homeworkService = {
  async getAll(params) {
    return this.getHomeworkList(params)
  },

  async getHomeworkList({ classFilter, status } = {}) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('homework')
          .select('*')
          .order('due_date', { ascending: true })

        if (status && status !== 'All' && status !== 'all') query = query.eq('status', status)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          let results = data.map(h => ({
            id: h.id,
            title: h.title,
            subject: 'General',
            class: 'Class 8',
            teacher: 'Faculty Member',
            description: h.description,
            dueDate: h.due_date,
            status: h.status || 'Active',
            createdAt: h.created_at?.split('T')[0] || '2026-08-20',
          }))

          if (classFilter && classFilter !== 'all') {
            results = results.filter(h => h.class.toLowerCase().includes(classFilter.toLowerCase()))
          }
          return results
        }
      } catch (err) {
        console.warn('Supabase getHomeworkList error:', err)
      }
    }

    return []
  },

  async getHomeworkById(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('homework')
          .select('*')
          .eq('id', id)
          .single()

        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            subject: 'General',
            class: 'Class 8',
            teacher: 'Faculty Member',
            description: data.description,
            dueDate: data.due_date,
            status: data.status || 'Active',
          }
        }
      } catch (err) {
        console.warn('Supabase getHomeworkById error:', err)
      }
    }

    return null
  },

  async create(data) {
    return this.createHomework(data)
  },

  async createHomework(data) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from('homework')
          .insert([{
            title: data.title,
            description: data.description,
            due_date: data.dueDate,
            status: 'Active',
          }])
          .select()
          .single()

        if (!error && inserted) {
          await auditService.log({
            actionType: 'HOMEWORK_ASSIGNED',
            targetEntity: 'homework',
            targetId: inserted.id,
            details: data,
          })
          return inserted
        }
      } catch (err) {
        console.warn('Supabase createHomework error:', err)
      }
    }

    return {
      id: 'HW-' + Date.now(),
      ...data,
      status: 'Active',
    }
  },

  async remove(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('homework').delete().eq('id', id)
      } catch (err) {
        console.warn('Supabase remove homework error:', err)
      }
    }
    return { success: true }
  },

  async update(id, data) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: updated } = await supabase
          .from('homework')
          .update({
            title: data.title,
            description: data.description,
            due_date: data.dueDate,
          })
          .eq('id', id)
          .select()
          .single()
        return updated
      } catch (err) {}
    }
    return { id, ...data }
  },

  async getSubmissions(homeworkId, studentId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('homework_submissions')
          .select('*')

        if (homeworkId) query = query.eq('homework_id', homeworkId)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return data.map(s => ({
            id: s.id,
            homeworkId: s.homework_id,
            studentId: s.student_id,
            studentName: 'Student',
            status: s.status,
            submittedAt: s.submitted_at?.split('T')[0] || '2026-08-22',
            fileName: s.file_name,
            grade: s.grade,
            feedback: s.teacher_feedback,
          }))
        }
      } catch (err) {
        console.warn('Supabase getSubmissions error:', err)
      }
    }

    return []
  },

  async submitHomework(homeworkId, studentId, { fileName, text }) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from('homework_submissions')
          .insert([{
            homework_id: homeworkId,
            file_name: fileName || 'submission.pdf',
            submission_text: text || '',
            status: 'Submitted',
          }])
          .select()
          .single()

        if (!error && inserted) {
          await auditService.log({
            actionType: 'HOMEWORK_SUBMITTED',
            targetEntity: 'homework_submissions',
            details: { homework_id: homeworkId, student_id: studentId },
          })
          return inserted
        }
      } catch (err) {
        console.warn('Supabase submitHomework error:', err)
      }
    }

    return {
      id: 'SUB-HW-' + Date.now(),
      homeworkId,
      studentId,
      status: 'Submitted',
      submittedAt: new Date().toISOString().split('T')[0],
      fileName: fileName || 'submission.pdf',
    }
  },
}

export default homeworkService
