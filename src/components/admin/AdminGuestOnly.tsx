import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthProvider'
import { ADMIN_ROUTES } from '../../lib/adminRoutes'
import { AdminAuthLoading } from './AdminAuthLoading'

export function AdminGuestOnly() {
  const { isLoading, isAuthenticated } = useAdminAuth()

  if (isLoading) {
    return <AdminAuthLoading />
  }

  if (isAuthenticated) {
    return <Navigate to={ADMIN_ROUTES.dashboard} replace />
  }

  return <Outlet />
}
