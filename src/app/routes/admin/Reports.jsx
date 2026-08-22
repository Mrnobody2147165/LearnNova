import { useState } from 'react'
import { FileText, Download, Printer, X, BarChart3, Wallet, Users, CalendarCheck, Award } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import { downloadCSV, formatPKRFull } from '../../../utils/format'

const reports = [
  { id: 'RPT-1', title: 'Fee Collection Report', description: 'Comprehensive overview of fee collection across all classes', icon: Wallet, color: 'text-success', bg: 'bg-success-bg' },
  { id: 'RPT-2', title: 'Outstanding Fee Report', description: 'Detailed breakdown of outstanding and overdue fees', icon: BarChart3, color: 'text-danger', bg: 'bg-danger-bg' },
  { id: 'RPT-3', title: 'Student Enrollment Report', description: 'Enrollment statistics and trends by class and section', icon: Users, color: 'text-info', bg: 'bg-info-bg' },
  { id: 'RPT-4', title: 'Attendance Report', description: 'Attendance rates and patterns across all classes', icon: CalendarCheck, color: 'text-primary', bg: 'bg-primary-light' },
  { id: 'RPT-5', title: 'Academic Performance Report', description: 'Grade distribution and academic performance analysis', icon: Award, color: 'text-warning', bg: 'bg-warning-bg' },
]

const reportData = {
  'RPT-1': {
    summary: [
      { label: 'Total Generated', value: formatPKRFull(18400000) },
      { label: 'Total Collected', value: formatPKRFull(15700000) },
      { label: 'Outstanding', value: formatPKRFull(2700000) },
      { label: 'Collection Rate', value: '85.3%' },
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
      { label: 'Total Outstanding', value: formatPKRFull(2700000) },
      { label: 'Overdue', value: formatPKRFull(1200000) },
      { label: 'Pending', value: formatPKRFull(1500000) },
      { label: 'Students Affected', value: '213' },
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
      { label: 'Total Students', value: '1,842' },
      { label: 'New Admissions', value: '152' },
      { label: 'Active Students', value: '1,798' },
      { label: 'Inactive', value: '44' },
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
      { label: 'Average Attendance', value: '92.5%' },
      { label: 'Present Today', value: '1,720' },
      { label: 'Absent Today', value: '122' },
      { label: 'Late Today', value: '45' },
    ],
    rows: [
      { class: 'Class 6', rate: '94.2%', present: 158, absent: 10 },
      { class: 'Class 7', rate: '91.8%', present: 161, absent: 14 },
      { class: 'Class 8', rate: '93.5%', present: 180, absent: 12 },
      { class: 'Class 9', rate: '89.7%', present: 188, absent: 22 },
      { class: 'Class 10', rate: '93.1%', present: 154, absent: 11 },
    ],
  },
  'RPT-5': {
    summary: [
      { label: 'Average Score', value: '82.4%' },
      { label: 'Top Grade', value: 'A+' },
      { label: 'Pass Rate', value: '96.2%' },
      { label: 'Students Honored', value: '127' },
    ],
    rows: [
      { class: 'Class 6', average: 84, topGrade: 'A+', passRate: '98%' },
      { class: 'Class 7', average: 81, topGrade: 'A', passRate: '97%' },
      { class: 'Class 8', average: 83, topGrade: 'A+', passRate: '96%' },
      { class: 'Class 9', average: 80, topGrade: 'A', passRate: '95%' },
      { class: 'Class 10', average: 84, topGrade: 'A+', passRate: '95%' },
    ],
  },
}

export default function Reports() {
  const toast = useToast()
  const [previewReport, setPreviewReport] = useState(null)

  const handleExportCSV = (report) => {
    const data = reportData[report.id]
    if (data && data.rows) {
      downloadCSV(`${report.title.replace(/\s+/g, '_')}.csv`, data.rows)
      toast.success('Report exported to CSV')
    }
  }

  const handlePrint = () => {
    window.print()
    toast.info('Sending to printer...')
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and export school performance reports" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(rpt => {
          const Icon = rpt.icon
          return (
            <Card key={rpt.id} className="hover:border-primary transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-btn ${rpt.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${rpt.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-ink">{rpt.title}</h3>
                  <p className="text-xs text-ink-secondary mt-1">{rpt.description}</p>
                </div>
              </div>
              <Button variant="secondary" className="w-full" onClick={() => setPreviewReport(rpt)}>
                <FileText className="w-4 h-4" /> Preview Report
              </Button>
            </Card>
          )
        })}
      </div>

      <Modal
        open={!!previewReport}
        onClose={() => setPreviewReport(null)}
        title={previewReport?.title || 'Report'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={handlePrint}><Printer className="w-4 h-4" /> Print</Button>
            <Button variant="secondary" onClick={() => handleExportCSV(previewReport)}><Download className="w-4 h-4" /> Export CSV</Button>
            <Button onClick={() => toast.info('PDF export will be available with backend integration')}>Export PDF</Button>
          </>
        }
      >
        {previewReport && reportData[previewReport.id] && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {reportData[previewReport.id].summary.map((s, i) => (
                <div key={i} className="p-3 bg-surface-app rounded-btn">
                  <p className="text-xs text-ink-muted">{s.label}</p>
                  <p className="text-lg font-semibold text-ink mt-1">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-border">
                    {Object.keys(reportData[previewReport.id].rows[0] || {}).map(key => (
                      <th key={key} className="table-header capitalize">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData[previewReport.id].rows.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="table-cell">{typeof val === 'number' ? val.toLocaleString() : val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
