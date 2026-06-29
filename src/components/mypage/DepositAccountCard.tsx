import { DepositAccountInfo } from '../deposit/DepositAccountInfo'

export function DepositAccountCard() {
  return (
    <DepositAccountInfo
      showIcon
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
    />
  )
}
