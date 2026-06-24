import { Navigate, Route, Routes } from 'react-router-dom'
import { ChangePasswordPage } from '@/components/auth/change-password-page'
import { LoginPage } from '@/components/auth/login-page'
import { RouteGuard } from '@/components/auth/route-guard'
import { AuthProvider } from '@/contexts/auth-context'

function Placeholder({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
    </main>
  )
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<RouteGuard />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/trocar-senha" element={<ChangePasswordPage />} />
          <Route path="/admin/*" element={<Placeholder title="Administração" />} />
          <Route path="/dashboard/*" element={<Placeholder title="Dashboard" />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
