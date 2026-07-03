import { describe, expect, it } from 'vitest'
import {
  formatVerificationExpiryLabel,
  maskPhoneForDisplay,
} from './passwordResetConfig'

describe('passwordResetConfig', () => {
  it('masks phone numbers for display', () => {
    expect(maskPhoneForDisplay('01012345678')).toBe('010-****-5678')
  })

  it('formats remaining verification time', () => {
    const expiresAt = new Date(Date.now() + 125_000).toISOString()
    expect(formatVerificationExpiryLabel(expiresAt)).toMatch(/남은 시간 2분/)
  })

  it('reports expired verification codes', () => {
    const expiresAt = new Date(Date.now() - 1_000).toISOString()
    expect(formatVerificationExpiryLabel(expiresAt)).toBe('인증번호가 만료되었습니다.')
  })
})
