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

import { jsPDF } from 'jspdf'

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

export function generateClientSidePDF(challanData, schoolName = 'Learnify Model Academy') {
  const doc = new jsPDF()

  // Header background
  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, 210, 32, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(String(schoolName).toUpperCase(), 105, 15, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('OFFICIAL FEE CHALLAN VOUCHER', 105, 24, { align: 'center' })

  doc.setTextColor(30, 41, 59)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  
  const challanNo = challanData?.challanNo || challanData?.challan_number || challanData?.id || 'CH-001'
  const studentName = challanData?.studentName || 'Student'
  const studentClass = challanData?.class || challanData?.grade || 'N/A'
  const month = challanData?.month || challanData?.billing_month || 'Current Month'
  const dueDate = challanData?.dueDate || challanData?.due_date || '2026-08-30'
  const total = challanData?.total || challanData?.total_amount || 0
  const discount = challanData?.discount || challanData?.discount_amount || 0
  const lateFee = challanData?.lateFee || challanData?.late_fee || 0

  doc.text(`Challan No: ${challanNo}`, 14, 45)
  doc.text(`Billing Month: ${month}`, 140, 45)

  doc.setDrawColor(226, 232, 240)
  doc.line(14, 50, 196, 50)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Student Name: ${studentName}`, 14, 58)
  doc.text(`Class: ${studentClass}`, 14, 65)
  doc.text(`Due Date: ${dueDate}`, 140, 58)
  doc.text(`Issue Date: ${new Date().toISOString().split('T')[0]}`, 140, 65)

  // Table header
  doc.setFillColor(241, 245, 249)
  doc.rect(14, 75, 182, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.text('Item Particulars', 20, 81.5)
  doc.text('Amount (PKR)', 188, 81.5, { align: 'right' })

  let y = 92
  doc.setFont('helvetica', 'normal')
  doc.text('Monthly Tuition Fee', 20, y)
  doc.text(`PKR ${Number(total).toLocaleString()}`, 188, y, { align: 'right' })

  if (discount > 0) {
    y += 8
    doc.text('Scholarship / Fee Discount', 20, y)
    doc.text(`- PKR ${Number(discount).toLocaleString()}`, 188, y, { align: 'right' })
  }

  if (lateFee > 0) {
    y += 8
    doc.text('Late Payment Fine', 20, y)
    doc.text(`+ PKR ${Number(lateFee).toLocaleString()}`, 188, y, { align: 'right' })
  }

  y += 12
  doc.setFillColor(236, 253, 245)
  doc.rect(14, y - 6, 182, 12, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(6, 95, 70)
  doc.text('NET PAYABLE AMOUNT', 20, y + 2)
  doc.text(`PKR ${Number(total).toLocaleString()}`, 188, y + 2, { align: 'right' })

  // Footer Note
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('Note: Please deposit dues by the due date. Send payment receipt to admin once paid.', 14, y + 25)
  doc.text('This is an automated computer-generated voucher and does not require a manual signature.', 14, y + 31)

  const filename = `${challanNo}.pdf`
  doc.save(filename)
  return filename
}

export const pdfGenerator = {
  /**
   * Generate a challan PDF via the backend or client-side fallback and download it.
   */
  async generateChallan(challanData, schoolData = {}) {
    const challanId = challanData?.rawId || challanData?.id

    try {
      if (challanId) {
        // Try direct PDF endpoint first (works without Storage)
        const response = await fetch(`${BACKEND_URL}/api/notify/pdf/challan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challanId }),
        })

        const result = await response.json()

        if (response.ok && result.pdfBase64) {
          const filename = challanData?.challanNo || challanData?.challanNumber || 'challan'
          downloadFromUrl(result.pdfBase64, `${filename}.pdf`)
          return { success: true, pdfLink: result.pdfBase64 }
        }
      }
    } catch (err) {
      console.warn('Backend PDF endpoint unavailable, generating client-side PDF:', err.message)
    }

    // Client-side fallback via jsPDF
    const filename = generateClientSidePDF(challanData, schoolData?.name || 'Learnify Model Academy')
    return { success: true, clientSide: true, filename }
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
      // Try direct PDF endpoint first (works without Storage)
      const response = await fetch(`${BACKEND_URL}/api/notify/pdf/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challanId }),
      })

      const result = await response.json()

      if (response.ok && result.pdfBase64) {
        // Open base64 PDF in new tab
        openInNewTab(result.pdfBase64)
        return { success: true, pdfLink: result.pdfBase64 }
      }

      // Fallback: try the notify endpoint (uses Storage)
      console.warn('Direct PDF unavailable, trying notify endpoint...')
      const fallback = await fetch(`${BACKEND_URL}/api/notify/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challanId }),
      })
      const fbResult = await fallback.json()
      if (fallback.ok && fbResult.summary?.pdfLink) {
        openInNewTab(fbResult.summary.pdfLink)
        return { success: true, pdfLink: fbResult.summary.pdfLink }
      }

      console.warn('PDF generation failed:', result)
    } catch (err) {
      console.error('viewChallanPDF error:', err)
    }
  },
}

export default pdfGenerator
