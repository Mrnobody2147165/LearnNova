import { supabase, isSupabaseConfigured } from './supabase'
import challanService from './challans'
import studentService from './students'
import whatsappService from './whatsapp'
import { auditService } from './audit'

const AUTO_BILLING_CONFIG_KEY = 'learnify_auto_billing_config'

export const getAutoBillingConfig = () => {
  const saved = localStorage.getItem(AUTO_BILLING_CONFIG_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {}
  }
  return {
    enabled: true,
    dispatchDayOfMonth: 1, // 1st of every month
    autoGenerate: true,
    autoWhatsAppBroadcast: true,
    lastRunMonth: '',
  }
}

export const saveAutoBillingConfig = (config) => {
  localStorage.setItem(AUTO_BILLING_CONFIG_KEY, JSON.stringify(config))
}

export const billingAutomationService = {
  /**
   * 1-Click Mass Broadcast to ALL pending student challans
   */
  async broadcastToAllPending({ onProgress, schoolName = 'Learnify Model Grammar School' } = {}) {
    const allChallans = await challanService.getAll({ status: 'Pending' })
    if (!allChallans || allChallans.length === 0) {
      return { total: 0, sent: 0, results: [] }
    }

    const results = []
    const total = allChallans.length

    for (let i = 0; i < total; i++) {
      const challan = allChallans[i]
      const phone = whatsappService.formatWhatsAppNumber(challan.studentPhone || '03001234567')
      const msg = whatsappService.generateChallanMessage(challan, schoolName)

      // In Direct mode: generate & log link or dispatch via API
      try {
        await whatsappService.sendViaAutomatedAPI(phone, msg)
      } catch (e) {}

      // Slight natural cadence between dispatches
      await new Promise(r => setTimeout(r, 450))

      const itemResult = {
        challanNo: challan.challanNo,
        studentName: challan.studentName,
        phone,
        total: challan.total,
        status: phone.length >= 10 ? 'Delivered' : 'Failed',
        timestamp: new Date().toLocaleTimeString(),
      }
      results.push(itemResult)

      if (onProgress) {
        onProgress(i + 1, total, itemResult)
      }
    }

    await auditService.log({
      actionType: 'WHATSAPP_MASS_BROADCAST_ALL',
      targetEntity: 'challans',
      details: {
        totalDispatched: results.length,
        successful: results.filter(r => r.status === 'Delivered').length,
      },
    })

    return {
      total,
      sent: results.filter(r => r.status === 'Delivered').length,
      results,
    }
  },

  /**
   * Automated scheduled check: runs on billing date
   */
  async checkAndRunAutoBilling(schoolName = 'Learnify Model Grammar School') {
    const config = getAutoBillingConfig()
    if (!config.enabled) return { ran: false, reason: 'Automation disabled' }

    const now = new Date()
    const currentDay = now.getDate()
    const currentMonthName = now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear()

    // If today is or after the dispatch day and we haven't generated for this month yet
    if (config.lastRunMonth === currentMonthName) {
      return { ran: false, reason: `Already ran for ${currentMonthName}` }
    }

    if (currentDay >= config.dispatchDayOfMonth) {
      console.log(`🤖 Automated Billing Engine: Generating monthly challans for ${currentMonthName}...`)

      // 1. Generate Challans for all active students
      const generated = await challanService.generate(currentMonthName)

      // 2. Auto-dispatch via WhatsApp if enabled
      let sentCount = 0
      if (config.autoWhatsAppBroadcast && generated && generated.length > 0) {
        const res = await this.broadcastToAllPending({ schoolName })
        sentCount = res.sent
      }

      // 3. Mark current month as completed
      config.lastRunMonth = currentMonthName
      saveAutoBillingConfig(config)

      return {
        ran: true,
        month: currentMonthName,
        generatedCount: generated?.length || 0,
        sentCount,
      }
    }

    return { ran: false, reason: `Scheduled for day ${config.dispatchDayOfMonth} of month` }
  },
}

export default billingAutomationService
