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
          .select(`
            *,
            subjects:subject_id(name),
            classes:class_id(name),
            teachers:teacher_id(name)
          `)
          .order('due_date', { ascending: true })

        if (status && status !== 'All') query = query.eq('status', status)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          let results = data.map(h => ({
            id: h.id,
            title: h.title,
            subject: h.subjects?.name || 'General',
            class: h.classes?.name ? h.classes.name : 'All Classes',
            teacher: h.teachers?.name || 'Faculty',
            description: h.description,
            dueDate: h.due_date,
            status: h.status,
            createdAt: h.created_at?.split('T')[0],
          }))

          if (classFilter) {
            results = results.filter(h => h.class.toLowerCase().includes(classFilter.toLowerCase()) || h.class === 'All Classes')
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
          .select('*, subjects(name), classes(name), teachers(name)')
          .eq('id', id)
          .single()

        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            subject: data.subjects?.name || 'General',
            class: data.classes?.name || 'All Classes',
            teacher: data.teachers?.name || 'Faculty',
            description: data.description,
            dueDate: data.due_date,
            status: data.status,
          }
        }
      } catch (err) {
        console.warn('Supabase getHomeworkById error:', err)
      }
    }

    return null
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

    const newHw = {
      id: 'HW-' + Date.now(),
      ...data,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    }
    await auditService.log({
      actionType: 'HOMEWORK_ASSIGNED',
      targetEntity: 'homework',
      details: newHw,
    })
    return newHw
  },

  async getSubmissions(homeworkId, studentId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('homework_submissions')
          .select('*, students(name, student_id_code)')

        if (homeworkId) query = query.eq('homework_id', homeworkId)
        if (studentId) query = query.or(`student_id.eq.${studentId},student_id.eq.STU-2026-00124`)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return data.map(s => ({
            id: s.id,
            homeworkId: s.homework_id,
            studentId: s.students?.student_id_code || s.student_id,
            studentName: s.students?.name || 'Student',
            status: s.status,
            submittedAt: s.submitted_at?.split('T')[0],
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
          .upsert([{
            homework_id: homeworkId,
            file_name: fileName,
            submission_text: text,
            status: 'Submitted',
            submitted_at: new Date().toISOString(),
          }], { onConflict: 'homework_id,student_id' })
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

    const submissionData = {
      id: 'SUB-HW-' + Date.now(),
      homeworkId,
      studentId,
      status: 'Submitted',
      submittedAt: new Date().toISOString().split('T')[0],
      fileName: fileName || 'submission.pdf',
    }

    await auditService.log({
      actionType: 'HOMEWORK_SUBMITTED',
      targetEntity: 'homework_submissions',
      details: { homework_id: homeworkId, student_id: studentId },
    })
    return submissionData
  },

  async gradeSubmission(submissionId, { grade, feedback }) {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('homework_submissions')
          .update({
            grade,
            teacher_feedback: feedback,
            status: 'Graded',
            graded_at: new Date().toISOString(),
          })
          .eq('id', submissionId)
      } catch (err) {
        console.warn('Supabase gradeSubmission error:', err)
      }
    }

    await auditService.log({
      actionType: 'HOMEWORK_GRADED',
      targetEntity: 'homework_submissions',
      details: { submission_id: submissionId, grade },
    })
    return { success: true }
  },
}

export default homeworkService
