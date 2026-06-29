import { useEffect, useRef, useState } from 'react'
import {
  CONSULTATION_STATUS_OPTIONS,
  getConsultationStatusOption,
} from '../../../lib/consultationStatusDisplay'
import { useConsultationStatus } from '../../../hooks/useConsultationStatus'
import type { ConsultationStatus } from '../../../types/consultationStatus'

interface AdminConsultationStatusDropdownProps {
  onStatusChanged?: (status: ConsultationStatus) => void
  onError?: (message: string) => void
}

export function AdminConsultationStatusDropdown({
  onStatusChanged,
  onError,
}: AdminConsultationStatusDropdownProps) {
  const { status, isSaving, saveStatus } = useConsultationStatus()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const current = getConsultationStatusOption(status)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown)
      return () => document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen])

  async function handleSelect(nextStatus: ConsultationStatus) {
    if (nextStatus === status || isSaving) {
      setIsOpen(false)
      return
    }

    try {
      await saveStatus(nextStatus)
      onStatusChanged?.(nextStatus)
      setIsOpen(false)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : '상담 상태를 저장하지 못했습니다.')
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        오늘의 상담 상태
      </p>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={isSaving}
        className="admin-animate-in mt-2 inline-flex w-full items-center justify-between gap-3 rounded-[20px] border border-neutral-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-neutral-300 hover:shadow-md disabled:opacity-60 sm:w-auto sm:min-w-[240px]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`text-sm font-semibold ${current.toneClass}`}>
          {current.emoji} {current.label}
        </span>
        <span className="text-xs text-neutral-400" aria-hidden="true">
          ▼
        </span>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="admin-animate-in absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-[20px] border border-neutral-200 bg-white py-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.12)] sm:right-auto sm:min-w-[240px]"
        >
          {CONSULTATION_STATUS_OPTIONS.map((option) => {
            const isActive = option.value === status

            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => void handleSelect(option.value)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-neutral-50 ${
                    isActive ? 'bg-neutral-50 font-semibold text-neutral-900' : 'text-neutral-700'
                  }`}
                >
                  <span>{option.emoji}</span>
                  <span>{option.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
