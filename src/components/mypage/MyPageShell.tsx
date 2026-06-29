import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'

interface MyPageShellProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  children: ReactNode
}

export function MyPageShell({
  title,
  description,
  backHref = ROUTES.mypage,
  backLabel = '마이페이지',
  children,
}: MyPageShellProps) {
  return (
    <div className="bg-neutral-50 pb-16 pt-10 sm:pb-20 sm:pt-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          to={backHref}
          className="inline-flex text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          ← {backLabel}
        </Link>

        <header className="mt-4 mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 text-sm text-neutral-500 sm:text-base">{description}</p> : null}
        </header>

        {children}
      </div>
    </div>
  )
}
