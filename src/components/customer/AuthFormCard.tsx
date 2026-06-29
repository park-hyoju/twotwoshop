import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'

interface AuthFormCardProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthFormCard({ title, description, children, footer }: AuthFormCardProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6 sm:py-20">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-neutral-500">TWOTWOSHOP</p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900 sm:text-3xl">{title}</h1>
        <p className="mt-3 text-base text-[#6B7280]">{description}</p>
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-6 border-t border-neutral-100 pt-6">{footer}</div> : null}
      </div>

      <Link
        to={ROUTES.home}
        className="mt-6 inline-flex text-sm text-neutral-600 transition-colors hover:text-neutral-900"
      >
        ← 쇼핑몰 홈으로
      </Link>
    </div>
  )
}

export const authInputClassName =
  'mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 outline-none transition-colors focus:border-neutral-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60'

export const authLabelClassName = 'block text-sm font-medium text-neutral-700'

export const authSubmitButtonClassName =
  'w-full rounded-full bg-neutral-900 py-3.5 text-base font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50'

export const authErrorClassName =
  'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
