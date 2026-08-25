import { useState, useEffect } from 'react'
import { FileText, Download, Printer, X, BarChart3, Wallet, Users, CalendarCheck, Award } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import dashboardService from '../../../services/dashboard'
import { downloadCSV, formatPKRFull } from '../../../utils/format'

const reportDefs = [
  { id: 'RPT-1', title: 'Fee Collection Report', description: 'Comprehensive overview of fee collection across all classes', icon: Wallet, color: 'text-success', bg: 'bg-success-bg' },
  { id: 'RPT-2', title: 'Outstanding Fee Report', description: 'Detailed breakdown of outstanding and overdue fees', icon: BarChart3, color: 'text-danger', bg: 'bg-danger-bg' },
  { id: 'RPT-3', title: 'Student Enrollment Report', description: 'Enrollment statistics and trends by class and section', icon: Users, color: 'text-info', bg: 'bg-info-bg' },
  { id: 'RPT-4', title: 'Attendance Report', description: 'Attendance rates and patterns across all classes', icon: CalendarCheck, color: 'text-primary', bg: 'bg-primary-light' },
]

export default function Reports() {
  const toast = useToast()
  const [previewReport, setPreviewReport] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    dashboardService.getStats().then(data => {
      if (data) setStats(data)
    })
  }, [])

  const getReportContent = (reportId) => {
    const totalCollected = stats?.totalCollected || 15700000
    const totalOutstanding = stats?.totalOutstanding || 2700000
    const totalGen = totalCollected + totalOutstanding
    const totalStudents = stats?.totalStudents || 1842
    const activeStudents = stats?.activeStudents || 1798

    const dataMap = {
      'RPT-1': {
        summary: [
          { label: 'Total Generated', value: formatPKRFull(totalGen) },
          { label: 'Total Collected', value: formatPKRFull(totalCollected) },
          { label: 'Outstanding', value: formatPKRFull(totalOutstanding) },
          { label: 'Collection Rate', value: `${stats?.collectionRate || 85.3}%` },
        ],
        rows: [
          { class: 'Class 6', generated: 1428000, collected: 1285000, rate: '90%' },
          { class: 'Class 7', generated: 1768000, collected: 1498000, rate: '84.7%' },
          { class: 'Class 8', generated: 2208000, collected: 1925000, rate: '87.2%' },
          { class: 'Class 9', generated: 2688000, collected: 2240000, rate: '83.3%' },
          { class: 'Class 10', generated: 2343000, collected: 2012000, rate: '85.9%' },
        ],
      },
      'RPT-2': {
        summary: [
          { label: 'Total Outstanding', value: formatPKRFull(totalOutstanding) },
          { label: 'Overdue', value: formatPKRFull(1200000) },
          { label: 'Pending', value: formatPKRFull(totalOutstanding - 1200000) },
          { label: 'Collection Target', value: formatPKRFull(totalGen) },
        ],
        rows: [
          { class: 'Class 8-B', amount: 384000, students: 42 },
          { class: 'Class 9-A', amount: 326000, students: 38 },
          { class: 'Class 7-C', amount: 281000, students: 35 },
          { class: 'Class 10-B', amount: 245000, students: 28 },
          { class: 'Class 6-C', amount: 198000, students: 25 },
        ],
      },
      'RPT-3': {
        summary: [
          { label: 'Total Students', value: totalStudents.toLocaleString() },
          { label: 'Active Students', value: activeStudents.toLocaleString() },
          { label: 'Class Count', value: '5 Classes' },
          { label: 'Section Count', value: '14 Sections' },
        ],
        rows: [
          { class: 'Class 6', students: 168, sections: 3 },
          { class: 'Class 7', students: 175, sections: 3 },
          { class: 'Class 8', students: 192, sections: 3 },
          { class: 'Class 9', students: 210, sections: 3 },
          { class: 'Class 10', students: 165, sections: 2 },
        ],
      },
      'RPT-4': {
        summary: [
          { label: 'Average Attendance', value: `${stats?.attendance?.presentPct || 91.4}%` },
          { label: 'Present Today', value: `${stats?.attendance?.presentPct || 91.4}%` },
          { label: 'Absent Rate', value: `${stats?.attendance?.absentPct || 6.2}%` },
          { label: 'Late Rate', value: `${stats?.attendance?.latePct || 2.4}%` },
        ],
        rows: [
          { class: 'Class 6', rate: '94.2%', present: 158, absent: 10 },
          { class: 'Class 7', rate: '91.8%', present: 161, absent: 14 },
          { class: 'Class 8', rate: '93.5%', present: 180, absent: 12 },
          { class: 'Class 9', rate: '89.7%', present: 188, absent: 22 },
          { class: 'Class 10', rate: '93.1%', present: 154, absent: 11 },
        ],
      },
    }

    return dataMap[reportId] || dataMap['RPT-1']
  }

  const handleExportCSV = (report) => {
    const data = getReportContent(report.id)
    downloadCSV(`${report.title.toLowerCase().replace(/\s+/g, '_')}.csv`, data.rows)
    toast.success(`${report.title} exported to CSV`)
  }

  const activeContent = previewReport ? getReportContent(previewReport.id) : null

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate and export comprehensive school administrative reports"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportDefs.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.id} className="flex flex-col justify-between hover:border-primary transition-colors">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-btn ${report.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${report.color}`} />
                  </div>
                  <span className="font-mono text-xs text-ink-muted">{report.id}</span>
                </div>
                <h3 className="text-base font-semibold text-ink mb-1">{report.title}</h3>
                <p className="text-sm text-ink-secondary mb-4">{report.description}</p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-border">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPreviewReport(report)}>
                  <FileText className="w-4 h-4" />
                  Preview
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleExportCSV(report)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Preview Modal */}
      {previewReport && activeContent && (
        <Modal
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
          title={previewReport.title}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activeContent.summary.map((item, i) => (
                <div key={i} className="p-3 rounded-btn bg-surface-app">
                  <p className="text-xs text-ink-muted">{item.label}</p>
                  <p className="text-base font-semibold text-ink mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto border border-border rounded-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-app">
                    {Object.keys(activeContent.rows[0]).map((key) => (
                      <th key={key} className="table-header capitalize">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeContent.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-hover">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="table-cell">{typeof val === 'number' && val > 1000 ? formatPKRFull(val) : String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button onClick={() => { handleExportCSV(previewReport); setPreviewReport(null) }}>
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
