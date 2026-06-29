import { Navigate } from 'react-router-dom'

export function LegacyRouteRedirect({ to }: { to: string }) {
  return <Navigate to={to} replace />
}
