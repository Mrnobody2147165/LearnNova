/**
 * Import Students Service
 * Handles CSV/XLSX file parsing, column mapping, validation, and bulk import.
 * Uses SheetJS (xlsx) for spreadsheet parsing.
 */

import * as XLSX from 'xlsx'
import studentService from './students'

/**
 * Known column name mappings — maps common spreadsheet header variants
 * to internal field names.
 */
const COLUMN_ALIASES = {
  studentId: ['student id', 'studentid', 'id', 'admission number', 'admission no', 'student_id', 'student_code', 'roll number', 'roll no'],
  fullName: ['full name', 'name', 'student name', 'full_name', 'student_name'],
  email: ['email', 'e-mail', 'email address', 'email_address'],
  phone: ['phone', 'phone number', 'mobile', 'contact', 'phone_number', 'contact_number'],
  dob: ['date of birth', 'dob', 'birth date', 'birthdate', 'date_of_birth'],
  guardianName: ['guardian name', 'parent name', 'father name', 'guardian', 'parent', 'guardian_name', 'father_name'],
  guardianPhone: ['guardian phone', 'parent phone', 'guardian contact', 'guardian_phone', 'parent_phone'],
  class: ['class', 'grade', 'class_name', 'grade_level'],
  section: ['section', 'division', 'group'],
  admissionDate: ['admission date', 'enrollment date', 'join date', 'admission_date', 'enrollment_date'],
  gender: ['gender', 'sex'],
  address: ['address', 'location', 'city'],
  feeStatus: ['fee status', 'fee_status', 'payment status'],
  status: ['status', 'active status'],
}

/**
 * Parse a file (CSV/XLSX/XLS) and return raw row data.
 */
export async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        resolve({
          rows: jsonData,
          headers: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
          sheetName,
          fileName: file.name,
          totalRows: jsonData.length,
        })
      } catch (err) {
        reject(new Error('Unable to parse file. Please ensure it is a valid CSV or Excel file.'))
      }
    }
    reader.onerror = () => reject(new Error('Error reading file.'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Auto-map spreadsheet columns to internal fields using fuzzy matching.
 */
export function autoMapColumns(headers) {
  const mapping = {}
  const unmapped = []

  for (const header of headers) {
    const normalized = header.toLowerCase().trim()
    let matched = false

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some(alias => normalized === alias || normalized.includes(alias))) {
        mapping[header] = field
        matched = true
        break
      }
    }

    if (!matched) {
      unmapped.push(header)
    }
  }

  return { mapping, unmapped }
}

/**
 * Validate a single row of student data.
 * Returns { valid: boolean, warnings: string[], errors: string[] }
 */
function validateRow(row, rowIndex, existingIds, existingEmails) {
  const errors = []
  const warnings = []

  // Required: studentId
  if (!row.studentId || String(row.studentId).trim() === '') {
    errors.push('Student ID is required')
  }

  // Required: fullName
  if (!row.fullName || String(row.fullName).trim() === '') {
    errors.push('Full name is required')
  }

  // Email validation
  if (row.email && String(row.email).trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(String(row.email).trim())) {
      errors.push('Invalid email format')
    }
  }

  // Class validation
  if (row.class) {
    const classNum = parseInt(row.class)
    if (isNaN(classNum) || classNum < 1 || classNum > 12) {
      errors.push('Invalid class (must be 1-12)')
    }
  }

  // Section validation
  if (row.section && !['A', 'B', 'C', 'D', 'E', ''].includes(String(row.section).trim().toUpperCase())) {
    warnings.push('Unusual section value')
  }

  // Date format validation
  if (row.dob && String(row.dob).trim() !== '') {
    const dateStr = String(row.dob).trim()
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      errors.push('Invalid date of birth format')
    }
  }

  if (row.admissionDate && String(row.admissionDate).trim() !== '') {
    const dateStr = String(row.admissionDate).trim()
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      errors.push('Invalid admission date format')
    }
  }

  // Duplicate checks
  if (row.studentId && existingIds.has(String(row.studentId).trim())) {
    warnings.push('Duplicate student ID in file')
  }
  if (row.email && existingEmails.has(String(row.email).trim().toLowerCase())) {
    warnings.push('Duplicate email in file')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    status: errors.length > 0 ? 'Error' : warnings.length > 0 ? 'Warning' : 'Valid',
  }
}

/**
 * Validate all rows after mapping.
 * @param {Array} rows - Raw spreadsheet rows
 * @param {Object} mapping - Column mapping (header -> field)
 * @returns {Object} Validation result with preview data
 */
export async function validateImport(rows, mapping) {
  // Apply mapping to transform rows
  const mapped = rows.map(row => {
    const mapped_row = {}
    for (const [header, value] of Object.entries(row)) {
      const field = mapping[header]
      if (field) {
        mapped_row[field] = String(value).trim()
      }
    }
    return mapped_row
  })

  // Collect existing IDs/emails for duplicate detection
  const existingIds = new Set()
  const existingEmails = new Set()
  mapped.forEach(row => {
    if (row.studentId) existingIds.add(row.studentId)
    if (row.email) existingEmails.add(row.email.toLowerCase())
  })

  // Also check against already-registered students
  try {
    const existing = await studentService.getAll()
    existing.forEach(s => {
      if (s.id) existingIds.add(s.id)
      if (s.email) existingEmails.add(String(s.email).toLowerCase())
    })
  } catch { /* ignore */ }

  // Validate each row
  const seen = { ids: new Set(), emails: new Set() }
  const results = mapped.map((row, i) => {
    // Check for in-file duplicates
    const inFileDupeIds = row.studentId && seen.ids.has(row.studentId)
    const inFileDupeEmails = row.email && seen.emails.has(row.email.toLowerCase())
    if (row.studentId) seen.ids.add(row.studentId)
    if (row.email) seen.emails.add(row.email.toLowerCase())

    const validation = validateRow(row, i, new Set(), new Set())
    if (inFileDupeIds) validation.warnings.push('Duplicate student ID in file')
    if (inFileDupeEmails) validation.warnings.push('Duplicate email in file')
    if (validation.warnings.length > 0 && validation.errors.length === 0) {
      validation.status = 'Warning'
    }

    return {
      rowNumber: i + 2, // +2 because Excel is 1-indexed and has a header row
      data: row,
      ...validation,
    }
  })

  const valid = results.filter(r => r.status === 'Valid').length
  const warningCount = results.filter(r => r.status === 'Warning').length
  const errorCount = results.filter(r => r.status === 'Error').length

  return {
    results,
    summary: {
      totalRows: results.length,
      valid,
      warnings: warningCount,
      errors: errorCount,
    },
    importableRows: results.filter(r => r.status !== 'Error'),
    errorRows: results.filter(r => r.status === 'Error'),
  }
}

/**
 * Execute the actual import of validated rows.
 * @param {Array} importableRows - Rows that passed validation
 * @param {string} duplicateStrategy - 'skip' | 'update' | 'import'
 * @param {Function} onProgress - Progress callback (processed, total)
 */
export async function executeImport(importableRows, duplicateStrategy = 'skip', onProgress) {
  const results = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  }

  // Fetch existing students for duplicate checking
  let existingStudents = []
  try {
    existingStudents = await studentService.getAll()
  } catch { /* ignore */ }

  const existingMap = new Map()
  existingStudents.forEach(s => {
    if (s.id) existingMap.set(s.id, s)
  })

  const total = importableRows.length
  const BATCH_SIZE = 50

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = importableRows.slice(i, i + BATCH_SIZE)

    for (const row of batch) {
      const studentData = row.data
      try {
        const existing = existingMap.get(studentData.studentId)

        if (existing) {
          if (duplicateStrategy === 'skip') {
            results.skipped++
          } else if (duplicateStrategy === 'update') {
            await studentService.update(existing.rawId || existing.id, {
              name: studentData.fullName || existing.name,
              phone: studentData.phone || existing.phone,
              email: studentData.email || existing.email,
              address: studentData.address || existing.address,
              feeStatus: studentData.feeStatus || existing.feeStatus,
              status: studentData.status || existing.status,
              rollNo: studentData.studentId,
            })
            results.updated++
          } else {
            // Import as new
            await studentService.create({
              name: studentData.fullName,
              studentId: studentData.studentId + '-dup',
              class: studentData.class,
              section: studentData.section || 'A',
              email: studentData.email || '',
              phone: studentData.phone || '',
              gender: studentData.gender || 'Male',
              dob: studentData.dob || '',
              admissionDate: studentData.admissionDate || '',
              address: studentData.address || '',
              feeStatus: studentData.feeStatus || 'Pending',
              status: studentData.status || 'Active',
            })
            results.imported++
          }
        } else {
          await studentService.create({
            name: studentData.fullName,
            studentId: studentData.studentId,
            class: studentData.class,
            section: studentData.section || 'A',
            email: studentData.email || '',
            phone: studentData.phone || '',
            gender: studentData.gender || 'Male',
            dob: studentData.dob || '',
            admissionDate: studentData.admissionDate || '',
            address: studentData.address || '',
            feeStatus: studentData.feeStatus || 'Pending',
            status: studentData.status || 'Active',
          })
          results.imported++
        }
      } catch (err) {
        results.errors++
        results.errorDetails.push({
          rowNumber: row.rowNumber,
          studentId: studentData.studentId,
          name: studentData.fullName,
          error: err.message,
        })
      }
    }

    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, total), total)
    }
  }

  return results
}

/**
 * Generate a CSV template for student import.
 */
export function downloadTemplate() {
  const headers = [
    'Student ID', 'Full Name', 'Email', 'Phone', 'Date of Birth',
    'Guardian Name', 'Guardian Phone', 'Class', 'Section', 'Admission Date',
  ]
  const sampleRow = [
    'STU-2026-00001', 'Ahmed Khan', 'ahmed@email.com', '+92 300 1234567',
    '2012-05-14', 'Imran Khan', '+92 300 7654321', '8', 'A', '2024-03-15',
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Students')
  XLSX.writeFile(wb, 'learnify_import_template.xlsx')
}

/**
 * Download error report as CSV.
 */
export function downloadErrorReport(errorRows) {
  const headers = ['Row Number', 'Student ID', 'Full Name', 'Status', 'Errors']
  const rows = errorRows.map(r => [
    r.rowNumber,
    r.data?.studentId || '',
    r.data?.fullName || '',
    r.status,
    (r.errors || []).join('; '),
  ])

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Import Errors')
  XLSX.writeFile(wb, 'learnify_import_errors.xlsx')
}
