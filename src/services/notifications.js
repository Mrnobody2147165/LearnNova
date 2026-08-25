import { supabase } from './supabase'

export const notificationService = {
  async getAll({ role = 'student', recipientId = null } = {}) {
    if (!supabase) return []
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (recipientId) {
        query = query.or(`recipient_id.eq.${recipientId},recipient_type.eq.${role}`)
      }

      const { data, error } = await query
      if (error || !data) return []

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
      console.error('Failed to fetch notifications from Supabase:', err)
      return []
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
      console.error('Failed to mark notification as read:', err)
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
      console.error('Failed to mark all notifications as read:', err)
    }
  },
}

export default notificationService
