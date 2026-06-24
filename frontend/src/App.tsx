import { Navigate, Route, Routes } from 'react-router-dom'
import { ChangePasswordPage } from '@/components/auth/change-password-page'
import { LoginPage } from '@/components/auth/login-page'
import { RouteGuard } from '@/components/auth/route-guard'
import { AuthProvider } from '@/contexts/auth-context'
import { AdminPage } from '@/pages/admin/admin-page'
import { AttendancePage } from '@/pages/dashboard/attendance-page'
import { DashboardPage } from '@/pages/dashboard/dashboard-page'
import { EnrollmentPage } from '@/pages/enrollment/enrollment-page'

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<RouteGuard />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inscricao" element={<EnrollmentPage />} />
          <Route path="/trocar-senha" element={<ChangePasswordPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/turmas/:id/chamada" element={<AttendancePage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
