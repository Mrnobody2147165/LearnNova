import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Avatar from '../../../components/ui/Avatar'
import Button from '../../../components/ui/Button'
import LoadingState from '../../../components/ui/LoadingState'
import studentService from '../../../services/students'
import { formatDate } from '../../../utils/format'

export default function StudentProfile() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    studentService.getStudentProfile(user?.id || user?.studentId).then(data => {
      setProfile(data)
      setLoading(false)
    })
  }, [user])

  if (loading) return <LoadingState />

  const profileData = {
    name: profile?.name || user?.name || 'Ahmed Khan',
    studentId: profile?.id || user?.studentId || 'STU-2026-00124',
    class: profile?.class || user?.class || '8-B',
    section: profile?.section || user?.section || 'B',
    email: profile?.email || user?.email || 'ahmed.khan@email.com',
    phone: profile?.phone || '+92 300 1234567',
    academicSession: '2025-2026',
    dob: profile?.dob || '2012-05-14',
    admissionDate: profile?.admissionDate || '2024-03-15',
    address: profile?.address || 'House 24, Gulshan-e-Iqbal, Karachi',
    guardian: profile?.guardian || 'Imran Khan',
    guardianPhone: profile?.guardianPhone || '+92 300 1234567',
    guardianEmail: profile?.guardianEmail || 'imran.khan@email.com',
    guardianOccupation: profile?.guardianOccupation || 'Business',
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Your personal, guardian, and academic enrollment information"
        actions={
          <Button variant="danger" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        }
      />

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
              <span className="text-sm text-ink-secondary">Class {profileData.class}</span>
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
              <p className="text-xs text-ink-muted">Date of Birth</p>
              <p className="text-sm font-medium text-ink">{formatDate(profileData.dob)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Admission Date</p>
              <p className="text-sm font-medium text-ink">{formatDate(profileData.admissionDate)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Residential Address</p>
              <p className="text-sm font-medium text-ink">{profileData.address}</p>
            </div>
          </div>
        </Card>

        {/* Guardian & Contact */}
        <Card>
          <h3 className="text-base font-semibold text-ink mb-4">Guardian & Contact Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-ink-muted">Guardian Name</p>
              <p className="text-sm font-medium text-ink">{profileData.guardian}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Guardian Phone</p>
              <p className="text-sm font-medium text-ink">{profileData.guardianPhone}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Guardian Email</p>
              <p className="text-sm font-medium text-ink">{profileData.guardianEmail}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Academic Session</p>
              <p className="text-sm font-medium text-ink">{profileData.academicSession}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
