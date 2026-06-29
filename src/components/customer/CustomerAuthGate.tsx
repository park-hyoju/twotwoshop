import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../../contexts/CustomerAuthProvider'
import { ROUTES } from '../../lib/routes'
import { CustomerAuthLoading } from './CustomerAuthLoading'

export function CustomerAuthGate() {
  const { isLoading, isMember } = useCustomerAuth()
  const location = useLocation()

  if (isLoading) {
    return <CustomerAuthLoading />
  }

  if (!isMember) {
    return (
      <Navigate
        to={ROUTES.signin}
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  return <Outlet />
}
