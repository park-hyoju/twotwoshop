import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'

const LIVE_ALERT_TOAST_MESSAGE = '라이브 알림 신청 기능은 준비 중입니다.'

function LiveToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="admin-animate-in fixed bottom-6 left-1/2 z-50 w-[min(92vw,360px)] -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm font-medium leading-6 text-neutral-800">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-800"
          aria-label="알림 닫기"
        >
          닫기
        </button>
      </div>
    </div>
  )
}

export function LiveComingSoon() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!toastMessage) {
      return
    }

    const timer = window.setTimeout(() => {
      setToastMessage(null)
    }, 3500)

    return () => window.clearTimeout(timer)
  }, [toastMessage])

  function handleAlertRequest() {
    setToastMessage(LIVE_ALERT_TOAST_MESSAGE)
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-xl rounded-[24px] border border-neutral-200/80 bg-gradient-to-b from-white via-white to-neutral-50 p-8 text-center shadow-[0_8px_32px_rgba(15,23,42,0.06)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-neutral-100 text-4xl">
            📺
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            준비 중인 라이브 방송
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600 sm:text-lg">
            첫 라이브 방송을 준비하고 있어요.
            <br />
            곧 다양한 상품과 혜택으로 찾아뵙겠습니다. 💛
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleAlertRequest}
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-neutral-900 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.99]"
            >
              알림 신청
            </button>
            <Link
              to={ROUTES.productsNew}
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 text-[15px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 active:scale-[0.99]"
            >
              신상품 보러가기
            </Link>
          </div>
        </div>
      </div>

      {toastMessage && (
        <LiveToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </>
  )
}
