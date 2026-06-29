import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface MyPageEmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  icon?: ReactNode
}

export function MyPageEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
}: MyPageEmptyStateProps) {
  const actionClassName =
    'inline-flex min-h-11 items-center justify-center rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800'

  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
      {icon ? <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">{icon}</div> : null}
      <p className="text-lg font-semibold text-neutral-900">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-500">{description}</p>
      ) : null}
      {actionLabel && actionHref ? (
        <Link to={actionHref} className={`${actionClassName} mt-6`}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className={`${actionClassName} mt-6`}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
