import { jsPDF } from 'jspdf'
import { formatPKRFull, formatDate } from '../utils/format'

export const pdfGenerator = {
  /**
   * Generates and downloads a professional Fee Challan PDF
   */
  generateChallan(challanData, schoolData = {}) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const schoolName = schoolData?.name || 'Learnify Grammar School'
    const schoolAddress = schoolData?.address || 'Main Campus, Block 5, Gulshan-e-Iqbal, Karachi'
    const schoolPhone = schoolData?.phone || '+92 21 34567890'
    const studentName = challanData?.studentName || challanData?.student || 'Student Name'
    const studentId = challanData?.studentId || 'STU-2026-00124'
    const studentClass = challanData?.class || 'Class 8-B'
    const challanNo = challanData?.challanNo || challanData?.challanNumber || 'CH-2026-001'
    const month = challanData?.month || challanData?.billingMonth || 'August 2026'
    const issueDate = challanData?.issueDate || new Date().toISOString().split('T')[0]
    const dueDate = challanData?.dueDate || '2026-08-30'
    const items = challanData?.feeBreakdown || challanData?.feeItems || [
      { name: 'Tuition Fee', amount: 9000 },
      { name: 'Computer Lab Fee', amount: 1200 },
      { name: 'Science Lab Fee', amount: 800 },
      { name: 'Sports & Activities', amount: 500 },
    ]
    const totalAmount = challanData?.total || challanData?.totalAmount || items.reduce((sum, i) => sum + (i.amount || 0), 0)

    // Header Background
    doc.setFillColor(30, 41, 59) // slate-800
    doc.rect(0, 0, 210, 38, 'F')

    // School Info
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(schoolName.toUpperCase(), 14, 16)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(203, 213, 225)
    doc.text(`${schoolAddress}  •  Tel: ${schoolPhone}`, 14, 23)
    doc.text('OFFICIAL FEE DEMAND CHALLAN', 14, 30)

    // Challan Badge
    doc.setFillColor(79, 70, 229) // Indigo
    doc.roundedRect(148, 10, 48, 18, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('CHALLAN NO', 172, 16, { align: 'center' })
    doc.setFontSize(10.5)
    doc.text(challanNo, 172, 23, { align: 'center' })

    // Student & Bill Info Grid
    doc.setFillColor(248, 250, 252) // slate-50
    doc.rect(14, 44, 182, 34, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(14, 44, 182, 34, 'S')

    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('STUDENT NAME', 20, 52)
    doc.text('STUDENT ID / ROLL', 85, 52)
    doc.text('CLASS / SECTION', 150, 52)

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(studentName, 20, 59)
    doc.text(studentId, 85, 59)
    doc.text(studentClass, 150, 59)

    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('BILLING MONTH', 20, 68)
    doc.text('ISSUE DATE', 85, 68)
    doc.text('DUE DATE', 150, 68)

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.text(month, 20, 74)
    doc.text(formatDate(issueDate), 85, 74)
    doc.setTextColor(225, 29, 72) // Rose-600
    doc.setFont('helvetica', 'bold')
    doc.text(formatDate(dueDate), 150, 74)

    // Table Header
    let y = 88
    doc.setFillColor(241, 245, 249)
    doc.rect(14, y, 182, 9, 'F')
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text('#', 20, y + 6)
    doc.text('FEE PARTICULARS / DESCRIPTION', 32, y + 6)
    doc.text('AMOUNT (PKR)', 188, y + 6, { align: 'right' })

    // Table Rows
    y += 9
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)

    items.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255)
      } else {
        doc.setFillColor(248, 250, 252)
      }
      doc.rect(14, y, 182, 9, 'F')
      doc.setDrawColor(241, 245, 249)
      doc.line(14, y + 9, 196, y + 9)

      doc.setTextColor(100, 116, 139)
      doc.text(String(idx + 1), 20, y + 6)

      doc.setTextColor(30, 41, 59)
      doc.text(item.name || item.description || 'Fee item', 32, y + 6)

      doc.setFont('helvetica', 'bold')
      doc.text(formatPKRFull(item.amount || 0), 188, y + 6, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      y += 9
    })

    // Total Amount Box
    y += 4
    doc.setFillColor(30, 41, 59)
    doc.rect(14, y, 182, 12, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.text('NET PAYABLE AMOUNT (BEFORE DUE DATE)', 20, y + 8)
    doc.setFontSize(12)
    doc.text(formatPKRFull(totalAmount), 188, y + 8, { align: 'right' })

    // Payment Instructions & Bank Details
    y += 20
    doc.setFillColor(248, 250, 252)
    doc.rect(14, y, 182, 38, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(14, y, 182, 38, 'S')

    doc.setTextColor(79, 70, 229)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('AUTHORIZED PAYMENT CHANNELS & INSTRUCTIONS', 20, y + 8)

    doc.setTextColor(51, 65, 85)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('1. Bank Deposit: Habib Bank Limited (HBL) - A/C # 0123-45678901-03 (Title: Learnify School)', 20, y + 15)
    doc.text('2. Mobile Banking: Kuickpay ID 100456 + Challan Number via JazzCash, Easypaisa, or 1Link 1Bill.', 20, y + 21)
    doc.text('3. Late Payment Penalty: PKR 500 will be added automatically to unpaid dues after the due date.', 20, y + 27)
    doc.text('4. Online Instant Portal: Pay with debit/credit card via your Learnify student portal.', 20, y + 33)

    // Signatures
    y += 50
    doc.setDrawColor(148, 163, 184)
    doc.line(20, y, 70, y)
    doc.line(140, y, 190, y)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text("Bank Officer's Signature & Stamp", 45, y + 5, { align: 'center' })
    doc.text("School Accounts Authority", 165, y + 5, { align: 'center' })

    // Footer note
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(`Generated by Learnify School Management System • Challan ${challanNo} • Issued: ${formatDate(issueDate)}`, 105, 285, { align: 'center' })

    doc.save(`${challanNo}.pdf`)
  },

  /**
   * Generates and downloads a Payment Receipt PDF with PAID watermark
   */
  generateReceipt(receiptData, schoolData = {}) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const schoolName = schoolData?.name || 'Learnify Grammar School'
    const schoolAddress = schoolData?.address || 'Main Campus, Block 5, Gulshan-e-Iqbal, Karachi'
    const studentName = receiptData?.studentName || receiptData?.student || 'Ahmed Khan'
    const studentId = receiptData?.studentId || 'STU-2026-00124'
    const receiptNo = receiptData?.receiptNo || receiptData?.id || 'REC-2026-089'
    const challanNo = receiptData?.challanNo || 'CH-2026-001'
    const amount = receiptData?.amount || receiptData?.total || 11500
    const paymentDate = receiptData?.date || receiptData?.paymentDate || new Date().toISOString().split('T')[0]
    const method = receiptData?.method || receiptData?.paymentMethod || 'Online (Debit Card)'

    // Header Background
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, 210, 38, 'F')

    // School Info
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(schoolName.toUpperCase(), 14, 16)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(203, 213, 225)
    doc.text(`${schoolAddress}`, 14, 23)
    doc.text('OFFICIAL ELECTRONIC PAYMENT RECEIPT', 14, 30)

    // Receipt Badge
    doc.setFillColor(16, 185, 129) // Emerald
    doc.roundedRect(148, 10, 48, 18, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('RECEIPT NO', 172, 16, { align: 'center' })
    doc.setFontSize(10.5)
    doc.text(receiptNo, 172, 23, { align: 'center' })

    // Payment Confirmation Banner
    doc.setFillColor(236, 253, 245) // emerald-50
    doc.rect(14, 44, 182, 24, 'F')
    doc.setDrawColor(16, 185, 129)
    doc.rect(14, 44, 182, 24, 'S')

    doc.setTextColor(5, 150, 105)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('PAYMENT RECEIVED & CONFIRMED', 20, 53)

    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Payment Date: ${formatDate(paymentDate)}  •  Channel: ${method}  •  Challan: ${challanNo}`, 20, 61)

    // Student Details
    doc.setFillColor(248, 250, 252)
    doc.rect(14, 74, 182, 30, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(14, 74, 182, 30, 'S')

    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('STUDENT NAME', 20, 83)
    doc.text('STUDENT ID', 85, 83)
    doc.text('TOTAL AMOUNT CLEARED', 145, 83)

    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(studentName, 20, 93)
    doc.text(studentId, 85, 93)
    doc.setTextColor(16, 185, 129)
    doc.setFontSize(12)
    doc.text(formatPKRFull(amount), 145, 93)

    // Watermark PAID
    doc.setTextColor(16, 185, 129)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(55)
    doc.text('PAID', 105, 155, { align: 'center' })

    // Signatures
    let y = 180
    doc.setDrawColor(148, 163, 184)
    doc.line(20, y, 70, y)
    doc.line(140, y, 190, y)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text("Authorized Signature", 45, y + 5, { align: 'center' })
    doc.text("System Electronic Verification", 165, y + 5, { align: 'center' })

    // Footer note
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(`Learnify Automated Payment Receipt • Receipt ID: ${receiptNo} • Retain this document for your records`, 105, 285, { align: 'center' })

    doc.save(`${receiptNo}.pdf`)
  },
}

export default pdfGenerator
