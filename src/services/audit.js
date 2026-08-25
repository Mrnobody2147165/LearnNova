import { supabase, isSupabaseConfigured } from './supabase'

let localAuditLogs = []

export const auditService = {
  async log({ actionType, targetEntity, targetId = null, details = {}, actorRole = 'admin', schoolId = null }) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      id: 'AUD-' + Date.now(),
      action_type: actionType,
      target_entity: targetEntity,
      target_id: targetId,
      details,
      actor_role: actorRole,
      created_at: timestamp,
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .insert([{
            school_id: schoolId,
            action_type: actionType,
            target_entity: targetEntity,
            target_id: targetId,
            details,
            actor_role: actorRole,
          }])
          .select()
          .single()

        if (!error && data) return data
      } catch (err) {
        console.warn('Supabase audit log fallback:', err)
      }
    }

    localAuditLogs.unshift(logEntry)
    return logEntry
  },

  async getRecentLogs(limit = 20) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (!error && data) return data
      } catch (err) {
        console.warn('Supabase getRecentLogs fallback:', err)
      }
    }
    return localAuditLogs.slice(0, limit)
  },
}

export default auditService
