import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface BenefitInfoModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function BenefitInfoModal({ isOpen, title, onClose, children }: BenefitInfoModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="benefit-modal-title"
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[20px] border border-[#eee] bg-white p-6 shadow-[0_24px_48px_rgba(0,0,0,0.12)] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 id="benefit-modal-title" className="text-xl font-semibold tracking-tight text-[#111]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#eee] text-[#666] transition-colors hover:bg-neutral-50"
            aria-label="닫기"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#666] sm:text-[15px]">
          {children}
        </div>
      </div>
    </div>
  )
}
