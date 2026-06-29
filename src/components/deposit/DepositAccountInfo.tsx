import { useState } from 'react'
import { Copy, Landmark } from 'lucide-react'
import {
  BANK_INFO,
  DEPOSIT_GUIDE_MESSAGES,
  formatDepositAccountNumber,
} from '../../lib/depositAccount'

interface DepositAccountInfoProps {
  title?: string
  description?: string
  showIcon?: boolean
  showCopyButton?: boolean
  className?: string
}

export function DepositAccountInfo({
  title = '입금 계좌 안내',
  description = '주문 후 아래 계좌로 입금해주세요.',
  showIcon = false,
  showCopyButton = true,
  className = '',
}: DepositAccountInfoProps) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  async function handleCopyAccountNumber() {
    const accountNumber = formatDepositAccountNumber(BANK_INFO.accountNumber)

    try {
      await navigator.clipboard.writeText(accountNumber)
      setCopyMessage('계좌번호가 복사되었습니다.')
    } catch {
      setCopyMessage('복사에 실패했습니다. 계좌번호를 직접 입력해주세요.')
    }

    window.setTimeout(() => setCopyMessage(null), 2000)
  }

  return (
    <section aria-label="입금 계좌 안내" className={className}>
      <div className={showIcon ? 'flex items-start gap-3' : undefined}>
        {showIcon ? (
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
            <Landmark className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-neutral-900 sm:text-lg">{title}</p>
          {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
        </div>
      </div>

      <dl className={`space-y-3 text-sm ${showIcon ? 'mt-5' : 'mt-4'}`}>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-neutral-500">은행명</dt>
          <dd className="font-medium text-neutral-900">{BANK_INFO.bank}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-neutral-500">예금주</dt>
          <dd className="font-medium text-neutral-900">{BANK_INFO.holder}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="shrink-0 text-neutral-500">계좌번호</dt>
          <dd className="font-mono text-sm font-semibold tracking-wide text-neutral-900">
            {BANK_INFO.accountNumber}
          </dd>
        </div>
      </dl>

      <ul className={`space-y-1 text-sm text-neutral-600 ${showCopyButton ? 'mt-4' : 'mt-3'}`}>
        {DEPOSIT_GUIDE_MESSAGES.map((message) => (
          <li key={message} className="leading-relaxed">
            {message}
          </li>
        ))}
      </ul>

      {showCopyButton ? (
        <>
          <button
            type="button"
            onClick={() => void handleCopyAccountNumber()}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
          >
            <Copy className="h-4 w-4" aria-hidden />
            계좌번호 복사
          </button>

          {copyMessage ? (
            <p role="status" className="mt-3 text-center text-xs text-neutral-600">
              {copyMessage}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
