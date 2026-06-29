import { describe, expect, it } from 'vitest'
import { BANK_INFO, formatDepositAccountNumber } from './depositAccount'

describe('depositAccount', () => {
  it('exposes the operational bank account constants', () => {
    expect(BANK_INFO).toEqual({
      bank: 'iM뱅크',
      accountNumber: '24613186453',
      holder: '이*영',
    })
  })

  it('strips whitespace from account numbers for clipboard copy', () => {
    expect(formatDepositAccountNumber('2461 3186453')).toBe('24613186453')
  })
})
