import { Navigate, Outlet } from 'react-router-dom'
import { useCustomerAuth } from '../../contexts/CustomerAuthProvider'
import { ROUTES } from '../../lib/routes'
import { CustomerAuthLoading } from './CustomerAuthLoading'

export function CustomerGuestOnly() {
  const { isLoading, isMember } = useCustomerAuth()

  if (isLoading) {
    return <CustomerAuthLoading />
  }

  if (isMember) {
    return <Navigate to={ROUTES.mypage} replace />
  }

  return <Outlet />
}
