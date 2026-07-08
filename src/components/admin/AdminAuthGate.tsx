import { useLayoutEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthProvider'
import { ADMIN_ROUTES } from '../../lib/adminRoutes'
import { ROUTES } from '../../lib/routes'
import { AdminAuthLoading } from './AdminAuthLoading'

export function AdminAuthGate() {
  const { authStatus, unauthorizedMessage } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useLayoutEffect(() => {
    if (authStatus === 'loading') {
      return
    }

    if (authStatus === 'unauthenticated') {
      navigate(ADMIN_ROUTES.login, {
        replace: true,
        state: {
          from: location.pathname,
          message: unauthorizedMessage ?? undefined,
        },
      })
      return
    }

    if (authStatus === 'forbidden') {
      navigate(ROUTES.forbidden, {
        replace: true,
        state: { message: unauthorizedMessage ?? undefined },
      })
    }
  }, [authStatus, location.pathname, navigate, unauthorizedMessage])

  if (authStatus !== 'authenticated') {
    return <AdminAuthLoading />
  }

  return <Outlet />
}
