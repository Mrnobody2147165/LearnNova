import { useAuthStore } from '../../../stores/authStore'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Avatar from '../../../components/ui/Avatar'

export default function StudentProfile() {
  const { user } = useAuthStore()

  const profileData = {
    name: user?.name || 'Ahmed Khan',
    studentId: user?.studentId || 'STU-2026-00124',
    class: user?.class || '8',
    section: user?.section || 'A',
    email: user?.email || 'ahmed.khan@email.com',
    academicSession: '2026-2027',
    dob: '2012-05-14',
    guardian: 'Imran Khan',
    guardianPhone: '+92 300 1234567',
    guardianEmail: 'imran.khan@email.com',
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your personal and academic information" />

      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <Avatar name={profileData.name} size="lg" />
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold text-ink">{profileData.name}</h2>
            <p className="text-sm text-ink-secondary mt-1">{profileData.studentId}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className="badge bg-success-bg text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Active
              </span>
              <span className="text-sm text-ink-secondary">Class {profileData.class}-{profileData.section}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Personal Information */}
        <Card>
          <h3 className="text-base font-semibold text-ink mb-4">Personal Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-ink-muted">Full Name</p>
              <p className="text-sm font-medium text-ink">{profileData.name}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Student ID</p>
              <p className="text-sm font-medium text-ink">{profileData.studentId}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Email</p>
              <p className="text-sm font-medium text-ink">{profileData.email}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Date of Birth</p>
              <p className="text-sm font-medium text-ink">{profileData.dob}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Academic Session</p>
              <p className="text-sm font-medium text-ink">{profileData.academicSession}</p>
            </div>
          </div>
        </Card>

        {/* Academic Information */}
        <Card>
          <h3 className="text-base font-semibold text-ink mb-4">Academic Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-ink-muted">Class</p>
              <p className="text-sm font-medium text-ink">Class {profileData.class}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Section</p>
              <p className="text-sm font-medium text-ink">{profileData.section}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Status</p>
              <p className="text-sm font-medium text-success">Active</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Academic Session</p>
              <p className="text-sm font-medium text-ink">{profileData.academicSession}</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-btn bg-surface-app border border-border">
            <p className="text-xs text-ink-muted">Academic information is managed by the school administration and cannot be edited by students.</p>
          </div>
        </Card>

        {/* Guardian Information */}
        <Card className="sm:col-span-2">
          <h3 className="text-base font-semibold text-ink mb-4">Guardian Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-ink-muted">Guardian Name</p>
              <p className="text-sm font-medium text-ink">{profileData.guardian}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Phone</p>
              <p className="text-sm font-medium text-ink">{profileData.guardianPhone}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Email</p>
              <p className="text-sm font-medium text-ink">{profileData.guardianEmail}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
