import { useLayoutEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthProvider'
import { ADMIN_ROUTES } from '../../lib/adminRoutes'
import { ROUTES } from '../../lib/routes'
import { AdminAuthLoading } from './AdminAuthLoading'

export function AdminGuestOnly() {
  const { authStatus } = useAdminAuth()
  const navigate = useNavigate()

  useLayoutEffect(() => {
    if (authStatus === 'loading') {
      return
    }

    if (authStatus === 'authenticated') {
      navigate(ADMIN_ROUTES.dashboard, { replace: true })
      return
    }

    if (authStatus === 'forbidden') {
      navigate(ROUTES.forbidden, { replace: true })
    }
  }, [authStatus, navigate])

  if (authStatus !== 'unauthenticated') {
    return <AdminAuthLoading />
  }

  return <Outlet />
}
