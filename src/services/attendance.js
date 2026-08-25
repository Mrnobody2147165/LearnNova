// Attendance Service with Supabase & Audit Tracking
import { supabase, isSupabaseConfigured } from './supabase'
import { auditService } from './audit'
import { todayISO } from '../utils/format'

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''))

export const attendanceService = {
  async getStats() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const today = todayISO()
        const { data } = await supabase
          .from('attendance_records')
          .select('status, date')

        if (data && data.length > 0) {
          const todayRecords = data.filter(r => r.date === today)
          const source = todayRecords.length > 0 ? todayRecords : data
          const present = source.filter(r => r.status === 'Present').length
          const absent = source.filter(r => r.status === 'Absent').length
          const late = source.filter(r => r.status === 'Late').length
          const total = source.length
          const avg = total > 0 ? Math.round((present / total) * 100) : 0

          return {
            averageAttendance: avg,
            presentToday: present,
            absentToday: absent,
            lateToday: late,
          }
        }
      } catch (err) {
        console.warn('Supabase getStats attendance error:', err)
      }
    }

    return {
      averageAttendance: 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
    }
  },

  async getStudentAttendance(studentId) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let stUuid = studentId
        let query = supabase
          .from('students')
          .select('id, student_id_code')

        if (isUUID(studentId)) {
          query = query.or(`id.eq.${studentId},student_id_code.eq.${studentId}`)
        } else {
          query = query.eq('student_id_code', studentId)
        }

        const { data: st } = await query.maybeSingle()
        if (st) stUuid = st.id

        const { data, error } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('student_id', stUuid)
          .order('date', { ascending: false })

        if (!error && data && data.length > 0) {
          return data.map(r => ({
            id: r.id,
            date: r.date,
            status: r.status,
            remarks: r.remarks || 'Recorded',
          }))
        }
      } catch (err) {
        console.warn('Supabase getStudentAttendance error:', err)
      }
    }

    return []
  },

  async bulkSaveAttendance({ date, classId, section, records }) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const rows = records.map(r => ({
          student_id: r.studentId,
          date: date || todayISO(),
          status: r.status || 'Present',
          remarks: r.remarks || '',
        }))

        const { data, error } = await supabase
          .from('attendance_records')
          .upsert(rows, { onConflict: 'student_id, date' })

        if (!error) {
          await auditService.log({
            actionType: 'ATTENDANCE_MARKED',
            targetEntity: 'attendance_records',
            details: { date, count: rows.length },
          })
          return { success: true, count: rows.length }
        }
      } catch (err) {
        console.warn('Supabase bulkSaveAttendance error:', err)
      }
    }

    return { success: true, count: records.length }
  },
}

export default attendanceService
