import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[AppErrorBoundary] uncaught error', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-neutral-900">일시적인 오류가 발생했습니다</h1>
            <p className="mt-3 text-sm text-neutral-600">
              페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              새로고침
            </button>
            <p className="mt-4">
              <Link to={ROUTES.home} className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline">
                쇼핑몰 홈으로
              </Link>
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
