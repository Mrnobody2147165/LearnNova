import { supabase } from './supabase'
import { formatPKRFull, formatDate } from '../utils/format'

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'August Fee Challan Issued',
    message: 'Monthly fee challan for August 2026 has been generated. Due date is August 30, 2026.',
    time: '2 hours ago',
    read: false,
    type: 'fee',
    link: '/student/fees',
  },
  {
    id: 'notif-2',
    title: 'Mathematics Homework Assigned',
    message: 'New assignment: Chapter 4 Quadratic Equations due by August 30.',
    time: 'Yesterday',
    read: false,
    type: 'homework',
    link: '/student/homework',
  },
  {
    id: 'notif-3',
    title: 'School Timetable Updated',
    message: 'Physics lab slot moved to Room 105 on Tuesdays and Thursdays.',
    time: '3 days ago',
    read: true,
    type: 'schedule',
    link: '/student/schedule',
  },
  {
    id: 'notif-4',
    title: 'Independence Day Assembly',
    message: 'All students are requested to be in formal school uniform for the morning assembly.',
    time: '1 week ago',
    read: true,
    type: 'announcement',
    link: '#',
  },
]

export const notificationService = {
  // --- Templates matching learnnova-notifications backend ---
  templates: {
    challanGenerated: {
      whatsapp: (data) =>
        `*Dear Parent,*\n\nA new fee challan has been generated for *${data.studentName || 'your child'}* at *LearnNova Grammar School*.\n\n` +
        `📄 *Challan No:* ${data.challanNo || data.challanNumber || 'CH-2026'}\n` +
        `💵 *Amount Due:* ${formatPKRFull(data.total || data.totalAmount || 0)}\n` +
        `📅 *Due Date:* ${formatDate(data.dueDate || '2026-08-30')}\n\n` +
        `_Please clear before the due date to avoid late fees. You can pay online or at any HBL branch._\n\n— *LearnNova Accounts*`,

      sms: (data) =>
        `LearnNova: Fee challan ${data.challanNo} for ${data.studentName}. Amount: ${formatPKRFull(data.total)}. Due: ${formatDate(data.dueDate)}. Pay online via student portal.`,

      emailSubject: (data) =>
        `New Fee Challan — ${data.studentName} (${data.challanNo})`,
    },

    paymentConfirmed: {
      whatsapp: (data) =>
        `*Dear Parent,*\n\nPayment of *${formatPKRFull(data.amount || data.total || 0)}* for *${data.studentName || 'your child'}* has been *CONFIRMED*.\n\n` +
        `🧾 *Receipt No:* ${data.receiptNo || 'REC-2026'}\n` +
        `💳 *Method:* ${data.method || 'Online Banking'}\n` +
        `📅 *Date:* ${formatDate(data.date || new Date().toISOString())}\n\n` +
        `_Thank you for your timely payment._\n\n— *LearnNova Accounts*`,

      sms: (data) =>
        `LearnNova: Payment of ${formatPKRFull(data.amount)} received for ${data.studentName}. Receipt: ${data.receiptNo}. Thank you!`,
    },

    overdueNotice: {
      whatsapp: (data) =>
        `*URGENT: Overdue Fee Notice*\n\n` +
        `Dear Parent of *${data.studentName}*,\n\nThe monthly fee challan *${data.challanNo}* is past due. Current payable with fine is *${formatPKRFull(data.total || 0)}*.\n\n` +
        `Please settle the dues immediately to prevent student portal suspension.\n\n— *LearnNova Administration*`,
    },
  },

  /**
   * Helper to open WhatsApp Web with prefilled message
   */
  sendWhatsApp(phone, message) {
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '')
    const formattedPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  },

  async getAll({ role = 'student', recipientId = null } = {}) {
    if (!supabase) return DEFAULT_NOTIFICATIONS
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (recipientId) {
        query = query.or(`recipient_id.eq.${recipientId},recipient_type.eq.${role}`)
      }

      const { data, error } = await query
      if (error || !data || data.length === 0) return DEFAULT_NOTIFICATIONS

      return data.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recent',
        read: n.is_read,
        type: n.notification_type || 'info',
        link: n.action_link || '#',
      }))
    } catch (err) {
      console.warn('Failed to fetch notifications from Supabase, using fallback:', err)
      return DEFAULT_NOTIFICATIONS
    }
  },

  async markAsRead(id) {
    if (!supabase) return
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
    } catch (err) {
      console.warn('Failed to mark notification as read:', err)
    }
  },

  async markAllAsRead() {
    if (!supabase) return
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false)
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err)
    }
  },
}

export default notificationService
