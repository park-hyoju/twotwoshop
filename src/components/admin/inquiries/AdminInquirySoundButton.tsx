import { useState } from 'react'
import { useAdminInquirySound } from '../../../contexts/AdminInquirySoundContext'

const PRIMED_STORAGE_KEY = 'admin-inquiry-alert-primed'

function hasAlertBeenPrimed(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.sessionStorage.getItem(PRIMED_STORAGE_KEY) === 'true'
}

function markAlertPrimed(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(PRIMED_STORAGE_KEY, 'true')
}

export function AdminInquirySoundButton() {
  const {
    isSoundEnabled,
    isVoiceEnabled,
    isVoiceSupported,
    isBusy,
    enableSound,
    disableSound,
    testSound,
    enableVoice,
    disableVoice,
    testVoice,
  } = useAdminInquirySound()
  const [showPrimeHint, setShowPrimeHint] = useState(() => !hasAlertBeenPrimed())

  function handleUserInteraction(): void {
    markAlertPrimed()
    setShowPrimeHint(false)
  }

  return (
    <div className="flex w-full flex-col items-end gap-2">
      {showPrimeHint && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          알림 사용을 위해 아래 버튼을 한 번 눌러주세요.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            handleUserInteraction()
            void testSound()
          }}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-60"
        >
          <span aria-hidden="true">🔊</span>
          알림음 테스트
        </button>

        {isSoundEnabled ? (
          <button
            type="button"
            onClick={() => {
              handleUserInteraction()
              disableSound()
            }}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-200 disabled:opacity-60"
          >
            <span aria-hidden="true">🔔</span>
            알림음 끄기
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              handleUserInteraction()
              void enableSound()
            }}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-60"
          >
            <span aria-hidden="true">🔔</span>
            {isBusy ? '처리 중...' : '알림음 켜기'}
          </button>
        )}

        {isVoiceSupported &&
          (isVoiceEnabled ? (
            <button
              type="button"
              onClick={() => {
                handleUserInteraction()
                disableVoice()
              }}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-900 transition-colors hover:bg-violet-100 disabled:opacity-60"
            >
              <span aria-hidden="true">🗣️</span>
              음성 안내 끄기
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                handleUserInteraction()
                enableVoice()
              }}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-900 transition-colors hover:bg-violet-50 disabled:opacity-60"
            >
              <span aria-hidden="true">🗣️</span>
              음성 안내 켜기
            </button>
          ))}

        {isVoiceSupported && (
          <button
            type="button"
            onClick={() => {
              handleUserInteraction()
              void testVoice()
            }}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-900 transition-colors hover:bg-violet-50 disabled:opacity-60"
          >
            <span aria-hidden="true">🗣️</span>
            음성 안내 테스트
          </button>
        )}

        {isSoundEnabled && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <span aria-hidden="true">🔔</span>
            알림음 활성화됨
            {isVoiceEnabled && <span className="text-violet-700">· 음성 안내 ON</span>}
          </span>
        )}
      </div>
    </div>
  )
}
