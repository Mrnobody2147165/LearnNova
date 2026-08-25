// Communications & Announcements Service with Supabase & Audit Tracking
import { supabase, isSupabaseConfigured } from './supabase'
import { auditService } from './audit'

const mockHistory = [
  { id: 'MSG-1', audience: 'All Parents', subject: 'Fee Reminder - August 2026', message: 'Dear parents, this is a reminder that August fees are due by the 10th. Please ensure timely payment.', date: '2026-08-05', sent: 1842, status: 'Sent' },
  { id: 'MSG-2', audience: 'Class 8-B', subject: 'Parent-Teacher Meeting', message: 'A parent-teacher meeting is scheduled for August 15th at 10 AM in the school auditorium.', date: '2026-08-03', sent: 64, status: 'Sent' },
  { id: 'MSG-3', audience: 'All Parents', subject: 'School Holiday Notice', message: 'The school will remain closed on August 14th for Independence Day.', date: '2026-08-01', sent: 1842, status: 'Sent' },
  { id: 'MSG-4', audience: 'Class 10-A', subject: 'Exam Schedule Released', message: 'The midterm exam schedule for Class 10-A has been released. Please check the school portal.', date: '2026-07-28', sent: 85, status: 'Sent' },
]

let historyList = [...mockHistory]

const delay = (ms = 150) => new Promise(r => setTimeout(r, ms))

export const communicationService = {
  async getHistory() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data) {
          return data.map(a => ({
            id: a.id,
            audience: a.audience === 'all' ? 'All Parents' : `Class ${a.target_class_id || ''}`,
            subject: a.subject,
            message: a.message,
            date: a.created_at?.split('T')[0],
            sent: a.sent_count || 1842,
            status: a.status || 'Sent',
          }))
        }
      } catch (err) {
        console.warn('Supabase getHistory fallback:', err)
      }
    }

    await delay()
    return [...historyList]
  },

  async sendAnnouncement(data) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from('announcements')
          .insert([{
            audience: data.audience,
            subject: data.subject,
            message: data.message,
            sent_count: data.audience === 'all' ? 1842 : 64,
            status: 'Sent',
          }])
          .select()
          .single()

        if (!error && inserted) {
          await auditService.log({
            actionType: 'ANNOUNCEMENT_SENT',
            targetEntity: 'announcements',
            targetId: inserted.id,
            details: data,
          })
          return inserted
        }
      } catch (err) {
        console.warn('Supabase sendAnnouncement fallback:', err)
      }
    }

    await delay()
    const newMsg = {
      id: 'MSG-' + (historyList.length + 1),
      audience: data.audienceLabel || 'All Parents',
      subject: data.subject,
      message: data.message,
      date: new Date().toISOString().split('T')[0],
      sent: data.audience === 'all' ? 1842 : 64,
      status: 'Sent',
    }
    historyList = [newMsg, ...historyList]
    await auditService.log({
      actionType: 'ANNOUNCEMENT_SENT',
      targetEntity: 'announcements',
      details: newMsg,
    })
    return newMsg
  },
}

export default communicationService
