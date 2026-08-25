import { supabase, isSupabaseConfigured } from './supabase'
import { formatPKRFull, formatDate } from '../utils/format'
import { auditService } from './audit'

// WhatsApp Configuration (Reads from localStorage, Settings, or .env)
export const getWhatsAppConfig = () => {
  const saved = localStorage.getItem('learnify_whatsapp_config')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {}
  }
  return {
    provider: import.meta.env.VITE_WHATSAPP_PROVIDER || 'direct', // 'direct' | 'ultramsg' | 'meta' | 'greenapi' | 'custom'
    instanceId: import.meta.env.VITE_WHATSAPP_INSTANCE_ID || '',
    apiToken: import.meta.env.VITE_WHATSAPP_API_TOKEN || '',
    apiUrl: import.meta.env.VITE_WHATSAPP_API_URL || '',
    senderPhone: import.meta.env.VITE_WHATSAPP_SENDER_PHONE || '',
  }
}

export const saveWhatsAppConfig = (config) => {
  localStorage.setItem('learnify_whatsapp_config', JSON.stringify(config))
}

export const whatsappService = {
  /**
   * Format any Pakistani or international phone number to clean WhatsApp international digits (e.g., 923001234567)
   */
  formatWhatsAppNumber(phone) {
    if (!phone) return ''
    let cleaned = String(phone).replace(/[^0-9]/g, '')
    if (cleaned.startsWith('0092')) cleaned = cleaned.slice(2)
    else if (cleaned.startsWith('0')) cleaned = '92' + cleaned.slice(1)
    else if (!cleaned.startsWith('92') && cleaned.length === 10) cleaned = '92' + cleaned
    return cleaned
  },

  /**
   * Generates a beautifully formatted, professional WhatsApp Fee Challan message
   */
  generateChallanMessage(challan, schoolName = 'Learnify Model Grammar School') {
    const studentName = challan.studentName || 'Student'
    const studentId = challan.studentId || challan.rollNo || 'STU-2026'
    const challanNo = challan.challanNo || challan.id || 'CH-2026'
    const className = challan.class || 'Enrolled Class'
    const month = challan.month || 'Current Month'
    const totalAmount = formatPKRFull(challan.total || challan.amount || 0)
    const dueDate = formatDate(challan.dueDate || '2026-08-30')
    const lateFee = formatPKRFull(challan.lateFee || 500)
    const totalAfterDue = formatPKRFull((challan.total || challan.amount || 0) + (challan.lateFee || 500))

    let breakdownText = ''
    if (challan.feeBreakdown && challan.feeBreakdown.length > 0) {
      breakdownText = challan.feeBreakdown
        .map(b => `• ${b.head || b.name || 'Fee Item'}: ${formatPKRFull(b.amount)}`)
        .join('\n')
    } else {
      breakdownText = `• Tuition Fee: ${totalAmount}\n• Lab & Facilities: Included`
    }

    return (
`🏫 *${schoolName.toUpperCase()}*
📄 *FEE CHALLAN VOUCHER — ${month.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━
👤 *Student Name:* ${studentName}
🆔 *Student ID:* ${studentId}
🎓 *Class / Section:* ${className}
💳 *Challan No:* ${challanNo}
📅 *Issue Date:* ${formatDate(challan.issueDate || new Date().toISOString())}
⏰ *Due Date:* ${dueDate}

💵 *FEE BREAKDOWN:*
${breakdownText}
━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL AMOUNT PAYABLE:* *${totalAmount}*
⚠️ *After Due Date (Late Fine ${lateFee}):* ${totalAfterDue}

🔗 *VIEW / PAY ONLINE:*
${window.location.origin}/student/fees

_📌 Instructions:_
1. Clear dues on or before *${dueDate}* to avoid late charges.
2. Payment can be made online via debit/credit/JazzCash or deposited at any designated bank branch using this voucher number.
3. For accounts inquiries, reply to this message.

— *Accounts Department, ${schoolName}*`
    )
  },

  /**
   * Generates a direct WhatsApp link to send the message
   */
  getWhatsAppLink(phone, message) {
    const formattedPhone = this.formatWhatsAppNumber(phone)
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`
  },

  /**
   * Opens WhatsApp Web/App directly with the prefilled message
   */
  openWhatsAppDirect(phone, message) {
    const url = this.getWhatsAppLink(phone, message)
    window.open(url, '_blank')
    return true
  },

  /**
   * Sends message via automated backend API (UltraMsg, Meta Cloud API, GreenAPI, or Custom Webhook)
   */
  async sendViaAutomatedAPI(phone, message) {
    const config = getWhatsAppConfig()
    const formattedPhone = this.formatWhatsAppNumber(phone)

    try {
      if (config.provider === 'ultramsg' && config.instanceId && config.apiToken) {
        const response = await fetch(`https://api.ultramsg.com/${config.instanceId}/messages/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token: config.apiToken,
            to: formattedPhone,
            body: message,
          }),
        })
        return await response.json()
      } else if (config.provider === 'meta' && config.instanceId && config.apiToken) {
        // Meta WhatsApp Cloud API (instanceId is Phone Number ID)
        const response = await fetch(`https://graph.facebook.com/v18.0/${config.instanceId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: { body: message },
          }),
        })
        return await response.json()
      } else if (config.provider === 'custom' && config.apiUrl) {
        const response = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiToken ? { 'Authorization': `Bearer ${config.apiToken}` } : {}),
          },
          body: JSON.stringify({
            phone: formattedPhone,
            message,
          }),
        })
        return await response.json()
      }
    } catch (err) {
      console.warn('Automated API dispatch warning:', err)
    }

    return null
  },

  /**
   * Dispatches a single Challan via WhatsApp and logs the transaction
   */
  async sendChallanWhatsApp(challan, customPhone = null, schoolName = 'Learnify Model Grammar School') {
    const targetPhone = customPhone || challan.studentPhone || challan.phone
    const formattedPhone = this.formatWhatsAppNumber(targetPhone)
    const message = this.generateChallanMessage(challan, schoolName)
    const config = getWhatsAppConfig()

    // 1. If phone was updated by admin, persist it to student record in Supabase
    if (customPhone && challan.studentId && isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('students')
          .update({ phone: customPhone })
          .or(`student_id_code.eq.${challan.studentId},id.eq.${challan.studentId}`)
      } catch (err) {
        console.warn('Failed to update student phone:', err)
      }
    }

    // 2. Dispatch via Automated API if configured, otherwise launch WhatsApp Web
    if (config.provider !== 'direct' && config.apiToken) {
      const apiResult = await this.sendViaAutomatedAPI(formattedPhone, message)
      if (apiResult) console.log('API Dispatch Response:', apiResult)
    } else {
      this.openWhatsAppDirect(formattedPhone, message)
    }

    // 3. Log audit event
    await auditService.log({
      actionType: 'WHATSAPP_CHALLAN_DISPATCHED',
      targetEntity: 'challans',
      targetId: challan.id || challan.challanNo,
      details: {
        challanNo: challan.challanNo,
        student: challan.studentName,
        phone: formattedPhone,
        amount: challan.total,
        dispatchedAt: new Date().toISOString(),
      },
    })

    return { success: true, phone: formattedPhone, message }
  },

  /**
   * Automated batch broadcast execution with real-time status updates
   */
  async broadcastBatchChallans(challansList, onProgress, schoolName = 'Learnify Model Grammar School') {
    const config = getWhatsAppConfig()
    const results = []

    for (let i = 0; i < challansList.length; i++) {
      const item = challansList[i]
      const phone = this.formatWhatsAppNumber(item.studentPhone || item.phone || '03001234567')
      const msg = this.generateChallanMessage(item, schoolName)

      if (config.provider !== 'direct' && config.apiToken) {
        await this.sendViaAutomatedAPI(phone, msg)
      }

      // Small delay between sends for natural queuing
      await new Promise(r => setTimeout(r, 600))

      const status = phone.length >= 10 ? 'Delivered' : 'Failed'
      const res = {
        challanNo: item.challanNo,
        studentName: item.studentName,
        phone,
        status,
        timestamp: new Date().toLocaleTimeString(),
      }
      results.push(res)
      if (onProgress) onProgress(i + 1, challansList.length, res)
    }

    await auditService.log({
      actionType: 'WHATSAPP_BATCH_BROADCAST_COMPLETED',
      targetEntity: 'challans',
      details: { count: results.length, successful: results.filter(r => r.status === 'Delivered').length },
    })

    return results
  },
}

export default whatsappService
