export const formatPKR = (amount) => {
  if (amount >= 1000000) {
    return `PKR ${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `PKR ${(amount / 1000).toFixed(1)}K`
  }
  return `PKR ${amount.toLocaleString('en-PK')}`
}

export const formatPKRFull = (amount) => {
  return `PKR ${amount.toLocaleString('en-PK')}`
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export const initials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

export const downloadCSV = (filename, rows) => {
  if (!rows || rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
  ].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export const todayISO = () => new Date().toISOString().split('T')[0]
