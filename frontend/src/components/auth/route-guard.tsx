import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getAuthRedirect } from '@/lib/auth-routing'
import { useAuth } from '@/contexts/auth-context'

export function RouteGuard() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    )
  }

  const redirect = getAuthRedirect(location.pathname, user)
  if (redirect) {
    return <Navigate to={redirect} replace state={{ from: location }} />
  }

  return <Outlet />
}
