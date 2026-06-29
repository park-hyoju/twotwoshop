export const BANK_INFO = {
  bank: 'iM뱅크',
  accountNumber: '24613186453',
  holder: '이*영',
} as const

export const DEPOSIT_GUIDE_MESSAGES = [
  '입금 확인 후 배송 준비가 시작됩니다.',
  '입금자명이 다르면 입금 확인이 지연될 수 있습니다.',
] as const

export function formatDepositAccountNumber(accountNumber: string): string {
  return accountNumber.replace(/\s/g, '')
}
