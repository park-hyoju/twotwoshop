import { useEffect, useRef, useState } from 'react'
import { loadDaumPostcodeScript, mapDaumPostcodeData, type SelectedAddress } from '../../lib/daumPostcode'

interface DaumPostcodeLayerProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (address: SelectedAddress) => void
}

export function DaumPostcodeLayer({ isOpen, onClose, onComplete }: DaumPostcodeLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const onCompleteRef = useRef(onComplete)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  onCloseRef.current = onClose
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null)
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    let cancelled = false
    container.innerHTML = ''

    void loadDaumPostcodeScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.daum?.Postcode) {
          return
        }

        const postcode = new window.daum.Postcode({
          oncomplete: (data) => {
            onCompleteRef.current(mapDaumPostcodeData(data))
            onCloseRef.current()
          },
          onclose: () => onCloseRef.current(),
          width: '100%',
          height: '100%',
        })

        postcode.embed(containerRef.current)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : '주소 검색을 불러오지 못했습니다.',
          )
        }
      })

    return () => {
      cancelled = true
      container.innerHTML = ''
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="주소 검색"
    >
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <p className="text-base font-semibold text-neutral-900">주소 찾기</p>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-700"
        >
          닫기
        </button>
      </div>

      {errorMessage ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p role="alert" className="text-sm text-red-600">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white"
          >
            돌아가기
          </button>
        </div>
      ) : (
        <div ref={containerRef} className="min-h-0 flex-1" />
      )}
    </div>
  )
}
