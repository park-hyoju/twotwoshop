import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthProvider'
import { ADMIN_ROUTES } from '../../lib/adminRoutes'
import { AdminAuthLoading } from './AdminAuthLoading'

export function AdminAuthGate() {
  const { isLoading, isAuthenticated, unauthorizedMessage } = useAdminAuth()
  const location = useLocation()

  if (isLoading) {
    return <AdminAuthLoading />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ADMIN_ROUTES.login}
        state={{
          from: location.pathname,
          message: unauthorizedMessage ?? undefined,
        }}
        replace
      />
    )
  }

  return <Outlet />
}
