/**
 * WhatsApp Notification Service
 *
 * Routes all WhatsApp / SMS / Email dispatch through the
 * LearnNova backend so that secret credentials (Twilio, SMTP)
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
import pdfGenerator from './pdfGenerator'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
const _LEGACY_WHATSAPP_CONFIG_KEY = 'learnify_whatsapp_config'
const WHATSAPP_CONFIG_KEY = 'learnnova_whatsapp_config'

export const getWhatsAppConfig = () => {
  const saved = localStorage.getItem(WHATSAPP_CONFIG_KEY) || localStorage.getItem(_LEGACY_WHATSAPP_CONFIG_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed && parsed.provider) {
        return parsed
      }
    } catch (e) {}
  }

  return {
    provider: import.meta.env.VITE_WHATSAPP_PROVIDER || 'direct',
    apiToken: import.meta.env.VITE_WHATSAPP_API_TOKEN || '',
    instanceId: import.meta.env.VITE_WHATSAPP_INSTANCE_ID || '',
    apiUrl: import.meta.env.VITE_WHATSAPP_API_URL || '',
    senderPhone: import.meta.env.VITE_WHATSAPP_SENDER_PHONE || '+923001234567',
  }
}

export const saveWhatsAppConfig = (config) => {
  localStorage.setItem(WHATSAPP_CONFIG_KEY, JSON.stringify(config))
}

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
  generateChallanMessage(challan, schoolName = 'LearnNova Model Grammar School') {
    const studentName = challan.studentName || 'Student'
    const challanNo = challan.challanNo || challan.challan_number || 'N/A'
    const month = challan.month || challan.billing_month || 'N/A'
    const total = challan.total || challan.total_amount || 0
    const dueDate = challan.dueDate || challan.due_date || 'N/A'
    const discount = challan.discount || challan.discount_amount || 0
    const lateFee = challan.lateFee || challan.late_fee || 0
    const challanId = challan.rawId || challan.id || challanNo

    // Use the configured backend URL so the link works for anyone anywhere
    const pdfUrl = `${BACKEND_URL}/api/notify/pdf/challan/${challanId}`

    let msg = `*${schoolName}*\n`
    msg += `-----------------------------------\n`
    msg += `*OFFICIAL FEE CHALLAN VOUCHER*\n\n`
    msg += `Student Name: *${studentName}*\n`
    msg += `Challan #: *${challanNo}*\n`
    msg += `Billing Month: *${month}*\n`
    msg += `Total Amount Due: *PKR ${Number(total).toLocaleString()}*\n`
    if (discount > 0) msg += `Scholarship / Discount: PKR ${Number(discount).toLocaleString()}\n`
    if (lateFee > 0) msg += `Late Fee Fine: PKR ${Number(lateFee).toLocaleString()}\n`
    msg += `Due Date: *${dueDate}*\n\n`
    msg += `📄 View / Download Official PDF Voucher:\n`
    msg += `${pdfUrl}\n\n`
    msg += `Please deposit fees by the due date. Thank you!\n`
    msg += `-----------------------------------\n`
    msg += `_This is an automated fee notice from ${schoolName}_`
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
  async sendViaAutomatedAPI(phone, message, challan = {}) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/notify/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { phone, whatsappOptIn: true },
          data: {
            schoolName: 'LearnNova Model Grammar School',
            studentName: challan.studentName || 'Imran (Admin)',
            challanNumber: challan.challanNo || challan.challan_number || 'CH-AUG-0776-01',
            totalAmount: challan.total || challan.total_amount || 11500,
            dueDate: challan.dueDate || challan.due_date || '2026-08-30'
          }
        }),
      })
      const res = await response.json()
      if (!res.success) {
        console.warn('sendViaAutomatedAPI failed, opening direct WhatsApp fallback:', res)
        this.openWhatsAppDirect(phone, message)
      }
      return res
    } catch (err) {
      console.warn('sendViaAutomatedAPI error:', err.message)
      this.openWhatsAppDirect(phone, message)
      return { success: false, fallback: 'wa.me link opened' }
    }
  },

  /**
   * Send a challan notification via WhatsApp.
   * Formats the WhatsApp message with a direct link to the PDF voucher
   * and launches WhatsApp Web directly without forcing local file downloads.
   */
  async sendChallanWhatsApp(challan, customPhone = null, schoolName = '') {
    let phone = customPhone || challan.studentPhone || '03265620214'
    if (!phone || phone.trim() === '') phone = '03265620214'

    const formatted = formatWhatsAppNumber(phone)
    if (!formatted) {
      console.warn('sendChallanWhatsApp: no valid phone number')
      return { success: false, error: 'No valid phone number' }
    }

    const config = getWhatsAppConfig()
    const challanId = challan.rawId || challan.id

    // If automated API mode is selected (meta / ultramsg / custom), route through backend for document attachment
    if (config.provider && config.provider !== 'direct') {
      const res = await this.sendViaAutomatedAPI(formatted, this.generateChallanMessage(challan, schoolName), challan)
      return { success: res.success, phone: formatted, automated: true }
    }

    // Direct WhatsApp Web Launcher: Embed direct PDF link in message, NO local browser file downloads!
    const message = this.generateChallanMessage(challan, schoolName || 'LearnNova Model Academy')
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')

    try {
      await auditService.log({
        actionType: 'WHATSAPP_CHALLAN_DISPATCHED',
        targetEntity: 'challans',
        targetId: challanId,
        details: {
          challanNo: challan.challanNo || challan.challan_number,
          student: challan.studentName,
          phone: formatted,
          dispatchedAt: new Date().toISOString(),
        },
      })
    } catch (e) { /* audit failure is non-critical */ }

    return { success: true, phone: formatted }
  },

  /**
   * Batch-broadcast challan notifications through the backend.
   * Calls the backend once per challan.
   */
  async broadcastBatchChallans(challansList, onProgress, schoolName = '') {
    const results = []

    for (let i = 0; i < challansList.length; i++) {
      const item = challansList[i]
      const res = await this.sendChallanWhatsApp(item, item.studentPhone || item.phone)

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
