/**
 * WhatsApp Notification Service
 *
 * Routes all WhatsApp / SMS / Email dispatch through the
 * Learnify backend so that secret credentials (Twilio, SMTP)
 * never leave the server.
 *
 * The backend handles:
 *   - PDF generation + Supabase Storage upload
 *   - WhatsApp via Twilio
 *   - SMS via Twilio
 *   - Email via Nodemailer
 *   - Graceful degradation if any channel fails
 *
 * Set VITE_BACKEND_URL in your .env to point at the deployed
 * backend.  Defaults to http://localhost:3000 for local dev.
 */

import { auditService } from './audit'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

// -- Utility helpers (kept for any UI code that references them) --

/**
 * Format any Pakistani or international phone number to clean
 * WhatsApp international digits (e.g., 923001234567).
 */
function formatWhatsAppNumber(phone) {
  if (!phone) return ''
  let cleaned = String(phone).replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0092')) cleaned = cleaned.slice(2)
  else if (cleaned.startsWith('0')) cleaned = '92' + cleaned.slice(1)
  else if (!cleaned.startsWith('92') && cleaned.length === 10) cleaned = '92' + cleaned
  return cleaned
}

export const whatsappService = {
  formatWhatsAppNumber,

  /**
   * Build a formatted text message for a challan notification.
   * Used by the UI preview panels and billing automation.
   */
  generateChallanMessage(challan, schoolName = 'Learnify Model Grammar School') {
    const studentName = challan.studentName || 'Student'
    const challanNo = challan.challanNo || challan.challan_number || 'N/A'
    const month = challan.month || challan.billing_month || 'N/A'
    const total = challan.total || challan.total_amount || 0
    const dueDate = challan.dueDate || challan.due_date || 'N/A'
    const discount = challan.discount || challan.discount_amount || 0
    const lateFee = challan.lateFee || challan.late_fee || 0

    let msg = `*${schoolName}*
`
    msg += `-----------------------------------
`
    msg += `*FEE CHALLAN NOTIFICATION*

`
    msg += `Student: *${studentName}*
`
    msg += `Challan #: *${challanNo}*
`
    msg += `Billing Month: ${month}
`
    msg += `Total Due: *PKR ${Number(total).toLocaleString()}*
`
    if (discount > 0) msg += `Discount: PKR ${Number(discount).toLocaleString()}
`
    if (lateFee > 0) msg += `Late Fee: PKR ${Number(lateFee).toLocaleString()}
`
    msg += `Due Date: *${dueDate}*

`
    msg += `Please ensure timely payment. Thank you!
`
    msg += `-----------------------------------
`
    msg += `_This is an automated message from ${schoolName}_`
    return msg
  },

  /**
   * Open a WhatsApp Web / App link directly with a pre-filled message.
   * Used for quick 1-click WhatsApp from the Students page.
   */
  openWhatsAppDirect(phone, message) {
    const formatted = formatWhatsAppNumber(phone)
    if (!formatted) {
      console.warn('openWhatsAppDirect: no valid phone number')
      return
    }
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message || '')}`
    window.open(url, '_blank')
  },

  /**
   * Send via the configured automated API (direct / ultramsg / meta / custom).
   * Used by billingAutomationService for scheduled mass broadcasts.
   * Routes through the backend so secrets stay server-side.
   */
  async sendViaAutomatedAPI(phone, message) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notify/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: { phone }, data: { message } }),
      })
      return await response.json()
    } catch (err) {
      console.warn('sendViaAutomatedAPI error:', err.message)
      this.openWhatsAppDirect(phone, message)
      return { success: false, fallback: 'wa.me link opened' }
    }
  },

  /**
   * Send a challan notification via the backend.
   * The backend resolves guardian contact from DB, generates PDF,
   * uploads it, and dispatches WhatsApp + SMS + Email server-side.
   */
  async sendChallanWhatsApp(challan, customPhone = null, schoolName = '') {
    const challanId = challan.rawId || challan.id

    try {
      const response = await fetch(`${BACKEND_URL}/api/notify/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challanId }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.warn('Backend notification failed:', result)
        return { success: false, error: result.errors || 'Backend error' }
      }

      await auditService.log({
        actionType: 'WHATSAPP_CHALLAN_DISPATCHED',
        targetEntity: 'challans',
        targetId: challanId,
        details: {
          challanNo: challan.challanNo || challan.challan_number,
          student: challan.studentName,
          summary: result.summary,
          dispatchedAt: new Date().toISOString(),
        },
      })

      return { success: true, summary: result.summary }
    } catch (err) {
      console.error('sendChallanWhatsApp error:', err)
      return { success: false, error: err.message }
    }
  },

  /**
   * Batch-broadcast challan notifications through the backend.
   * Calls the backend once per challan.
   */
  async broadcastBatchChallans(challansList, onProgress, schoolName = '') {
    const results = []

    for (let i = 0; i < challansList.length; i++) {
      const item = challansList[i]
      const res = await this.sendChallanWhatsApp(item)

      const status = res.success ? 'Delivered' : 'Failed'
      const entry = {
        challanNo: item.challanNo || item.challan_number,
        studentName: item.studentName,
        phone: formatWhatsAppNumber(item.studentPhone || item.phone),
        status,
        timestamp: new Date().toLocaleTimeString(),
      }
      results.push(entry)

      if (onProgress) onProgress(i + 1, challansList.length, entry)
      await new Promise(r => setTimeout(r, 300))
    }

    await auditService.log({
      actionType: 'WHATSAPP_BATCH_BROADCAST_COMPLETED',
      targetEntity: 'challans',
      details: {
        count: results.length,
        successful: results.filter(r => r.status === 'Delivered').length,
      },
    })

    return results
  },
}

export default whatsappService
