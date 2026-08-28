/**
 * PDF Generator Service
 *
 * Instead of generating PDFs client-side with jsPDF, this
 * service now calls the Learnify backend which:
 *   1. Generates the PDF server-side (pdfkit)
 *   2. Uploads it to Supabase Storage
 *   3. Returns a public URL (pdfLink)
 *
 * The frontend then downloads the hosted PDF file.
 *
 * Set VITE_BACKEND_URL in your .env to point at the deployed
 * backend.  Defaults to http://localhost:3000 for local dev.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

/**
 * Trigger a browser download of a file hosted at the given URL.
 */
function downloadFromUrl(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename || ''
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * Open a URL in a new browser tab (for viewing without downloading).
 */
function openInNewTab(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export const pdfGenerator = {
  /**
   * Generate a challan PDF via the backend and download it.
   *
   * The backend receives the challanId, fetches all data from
   * the DB, generates the PDF, uploads to Storage, and returns
   * the public URL.  We then download that URL.
   *
   * @param {Object} challanData - Must include rawId or id (challan UUID)
   * @param {Object} schoolData  - Unused, kept for API compatibility
   */
  async generateChallan(challanData, schoolData = {}) {
    const challanId = challanData?.rawId || challanData?.id

    if (!challanId) {
      console.error('generateChallan: no challanId provided')
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/notify/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challanId }),
      })

      const result = await response.json()

      if (!response.ok || !result.summary?.pdfLink) {
        console.warn('Backend PDF generation failed:', result)
        return
      }

      const pdfLink = result.summary.pdfLink
      const filename = challanData?.challanNo || challanData?.challanNumber || 'challan'

      downloadFromUrl(pdfLink, `${filename}.pdf`)
      return { success: true, pdfLink }
    } catch (err) {
      console.error('generateChallan error:', err)
    }
  },

  /**
   * Generate a receipt PDF via the backend and download it.
   *
   * @param {Object} receiptData - Must include challanId (rawId or id),
   *                               plus paymentDate and paymentMethod
   * @param {Object} schoolData  - Unused, kept for API compatibility
   */
  async generateReceipt(receiptData, schoolData = {}) {
    const challanId = receiptData?.rawId || receiptData?.challanId || receiptData?.id

    if (!challanId) {
      console.error('generateReceipt: no challanId provided')
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/notify/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challanId,
          paymentDate: receiptData?.date || receiptData?.paymentDate || new Date().toISOString().split('T')[0],
          paymentMethod: receiptData?.method || receiptData?.paymentMethod || 'Online',
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.summary?.pdfLink) {
        console.warn('Backend receipt generation failed:', result)
        return
      }

      const pdfLink = result.summary.pdfLink
      const filename = receiptData?.receiptNo || receiptData?.id || 'receipt'

      downloadFromUrl(pdfLink, `${filename}.pdf`)
      return { success: true, pdfLink }
    } catch (err) {
      console.error('generateReceipt error:', err)
    }
  },

  /**
   * View a challan PDF in a new browser tab (without downloading).
   * Useful for preview before sending notifications.
   */
  async viewChallanPDF(challanData) {
    const challanId = challanData?.rawId || challanData?.id

    if (!challanId) {
      console.error('viewChallanPDF: no challanId provided')
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/notify/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challanId }),
      })

      const result = await response.json()

      if (!response.ok || !result.summary?.pdfLink) {
        console.warn('Backend PDF generation failed:', result)
        return
      }

      openInNewTab(result.summary.pdfLink)
      return { success: true, pdfLink: result.summary.pdfLink }
    } catch (err) {
      console.error('viewChallanPDF error:', err)
    }
  },
}

export default pdfGenerator
