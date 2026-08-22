import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Wallet, Percent, Gift, ArrowRight } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import StatCard from '../../../components/ui/StatCard'
import LoadingState from '../../../components/ui/LoadingState'
import { useToast } from '../../../components/ui/Toast'
import feeService from '../../../services/fees'
import { formatPKR, formatPKRFull } from '../../../utils/format'

export default function Fees() {
  const navigate = useNavigate()
  const toast = useToast()
  const [overview, setOverview] = useState(null)
  const [structures, setStructures] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      feeService.getOverview(),
      feeService.getStructures(),
      feeService.getDiscounts(),
      feeService.getScholarships(),
    ]).then(([ov, st, dis, sch]) => {
      setOverview(ov)
      setStructures(st)
      setDiscounts(dis)
      setScholarships(sch)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Fees"
        subtitle="Manage fee structures, discounts, and scholarships"
        actions={
          <Button onClick={() => navigate('/fees/structure')}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Manage Structures</span>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Generated" value={formatPKR(overview.totalGenerated)} icon={Wallet} />
        <StatCard label="Collected" value={formatPKR(overview.collected)} icon={Wallet} />
        <StatCard label="Outstanding" value={formatPKR(overview.outstanding)} icon={Wallet} />
        <StatCard label="Collection Rate" value={`${overview.collectionRate}%`} icon={Percent} />
      </div>

      {/* Fee Structures */}
      <Card padding={false} className="mb-6">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-base font-semibold text-ink">Fee Structures</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/fees/structure')}>Manage <ArrowRight className="w-3.5 h-3.5" /></Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {structures.map(fs => (
            <div key={fs.id} className="border border-border rounded-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-ink">{fs.class}</h4>
                <span className="text-sm font-semibold text-primary">{formatPKRFull(fs.total)}</span>
              </div>
              <div className="space-y-1.5">
                {fs.items.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="text-ink-secondary">{item.name}</span>
                    <span className="text-ink">{formatPKRFull(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Discounts & Scholarships */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding={false}>
          <div className="p-5 border-b border-border">
            <h3 className="text-base font-semibold text-ink">Discounts</h3>
          </div>
          <div className="divide-y divide-border">
            {discounts.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{d.name}</p>
                  <p className="text-xs text-ink-muted">{d.students} students</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{d.percentage}%</p>
                  <p className="text-xs text-ink-muted">{formatPKRFull(d.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card padding={false}>
          <div className="p-5 border-b border-border">
            <h3 className="text-base font-semibold text-ink">Scholarships</h3>
          </div>
          <div className="divide-y divide-border">
            {scholarships.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{s.name}</p>
                  <p className="text-xs text-ink-muted">{s.students} students</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{s.percentage}%</p>
                  <p className="text-xs text-ink-muted">{formatPKRFull(s.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Late Fee Rules */}
      <Card className="mt-4">
        <h3 className="text-base font-semibold text-ink mb-4">Late Fee Rules</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface-app rounded-btn">
            <div>
              <p className="text-sm font-medium text-ink">Standard Late Fee</p>
              <p className="text-xs text-ink-muted">Applied after due date</p>
            </div>
            <span className="text-sm font-semibold text-ink">PKR 200 / month</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-app rounded-btn">
            <div>
              <p className="text-sm font-medium text-ink">Class 9-10 Late Fee</p>
              <p className="text-xs text-ink-muted">Higher late fee for senior classes</p>
            </div>
            <span className="text-sm font-semibold text-ink">PKR 300 / month</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
