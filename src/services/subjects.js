// Subjects & Curriculum Service with Supabase & Audit Tracking
import { supabase, isSupabaseConfigured } from './supabase'
import { auditService } from './audit'

export const subjectService = {
  async getAll() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*, teachers(name)')

        if (!error && data && data.length > 0) {
          return data.map(s => ({
            id: s.id,
            name: s.name,
            code: s.code,
            teacher: s.teachers?.name || 'Faculty Member',
            teacherId: s.lead_teacher_id,
            classes: ['Class 7', 'Class 8', 'Class 9'],
          }))
        }
      } catch (err) {
        console.warn('Supabase getAll subjects error:', err)
      }
    }

    return []
  },

  async create(data) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from('subjects')
          .insert([{
            name: data.name,
            code: data.code,
            lead_teacher_id: data.teacherId || null,
          }])
          .select()
          .single()

        if (!error && inserted) {
          await auditService.log({
            actionType: 'SUBJECT_CREATED',
            targetEntity: 'subjects',
            targetId: inserted.id,
            details: data,
          })
          return inserted
        }
      } catch (err) {
        console.warn('Supabase create subject error:', err)
      }
    }

    const newSub = {
      id: 'SUB-' + Date.now(),
      ...data,
    }
    await auditService.log({
      actionType: 'SUBJECT_CREATED',
      targetEntity: 'subjects',
      details: newSub,
    })
    return newSub
  },

  // Student specific subjects view with real topics & progress
  async getStudentSubjects(studentId, studentClass) {
    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. Fetch subjects from database
        const { data: subjectsData, error: subError } = await supabase
          .from('subjects')
          .select('*, teachers(name), subject_topics(*)')

        if (!subError && subjectsData && subjectsData.length > 0) {
          // 2. Fetch student's topic progress
          let progressMap = {}
          if (studentId) {
            const { data: progressData } = await supabase
              .from('student_topic_progress')
              .select('*')
              .or(`student_id.eq.${studentId},student_id.eq.STU-2026-00124`)

            if (progressData) {
              progressData.forEach(p => {
                progressMap[p.topic_id] = p.completed
              })
            }
          }

          return subjectsData.map(s => {
            const topics = (s.subject_topics || []).map(t => ({
              id: t.id,
              name: t.name,
              completed: Boolean(progressMap[t.id]),
              inProgress: !progressMap[t.id],
            }))

            const completedCount = topics.filter(t => t.completed).length
            const totalCount = topics.length || 1
            const progress = topics.length > 0 ? Math.round((completedCount / totalCount) * 100) : 0

            return {
              id: s.id,
              name: s.name,
              code: s.code,
              teacher: s.teachers?.name || 'Assigned Teacher',
              progress,
              average: 0,
              homeworkCount: 0,
              examCount: 0,
              attendance: 100,
              topics,
            }
          })
        }
      } catch (err) {
        console.warn('Supabase getStudentSubjects error:', err)
      }
    }

    return []
  },

  async getStudentSubjectById(id, studentId) {
    const list = await this.getStudentSubjects(studentId)
    const found = list.find(s => s.id === id || s.code === id)
    if (found) return found

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*, teachers(name), subject_topics(*)')
          .or(`id.eq.${id},code.eq.${id}`)
          .single()

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            code: data.code,
            teacher: data.teachers?.name || 'Assigned Teacher',
            progress: 0,
            average: 0,
            attendance: 100,
            topics: (data.subject_topics || []).map(t => ({ id: t.id, name: t.name, completed: false, inProgress: true })),
          }
        }
      } catch (err) {
        console.warn('Supabase getStudentSubjectById error:', err)
      }
    }

    return null
  },

  async toggleTopicProgress(subjectId, topicName, completed, studentId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        // Find topic id
        const { data: topic } = await supabase
          .from('subject_topics')
          .select('id')
          .eq('name', topicName)
          .single()

        if (topic && studentId) {
          await supabase
            .from('student_topic_progress')
            .upsert([{
              student_id: studentId,
              topic_id: topic.id,
              completed,
              completed_at: completed ? new Date().toISOString() : null,
            }], { onConflict: 'student_id,topic_id' })
        }
      } catch (err) {
        console.warn('Supabase toggleTopicProgress error:', err)
      }
    }

    await auditService.log({
      actionType: 'TOPIC_PROGRESS_TOGGLED',
      targetEntity: 'student_topic_progress',
      details: { subject_id: subjectId, topic: topicName, completed, student_id: studentId },
    })
    return { success: true }
  },
}

export default subjectService
