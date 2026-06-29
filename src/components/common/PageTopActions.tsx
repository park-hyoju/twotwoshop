import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'

const actionButtonClassName =
  'inline-flex min-h-10 items-center justify-center rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 sm:min-h-11 sm:px-5 sm:text-[15px]'

export function PageTopActions() {
  const navigate = useNavigate()

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    void navigate(ROUTES.home)
  }

  function handleClose() {
    void navigate(ROUTES.home)
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
      <button type="button" onClick={handleBack} className={actionButtonClassName}>
        ← 이전으로
      </button>
      <button type="button" onClick={handleClose} className={actionButtonClassName}>
        닫기
      </button>
    </div>
  )
}
