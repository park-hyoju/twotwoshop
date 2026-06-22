import { describe, expect, it } from 'vitest'
import {
  ADMIN_ALLOWED_EMAIL,
  ADMIN_INVALID_CREDENTIALS_MESSAGE,
  ADMIN_UNAUTHORIZED_MESSAGE,
  isAllowedAdminEmail,
  resolveAdminLoginId,
} from './adminAuthConfig'

describe('resolveAdminLoginId', () => {
  it('maps admin alias to allowed email', () => {
    expect(resolveAdminLoginId('admin')).toBe(ADMIN_ALLOWED_EMAIL)
    expect(resolveAdminLoginId(' Admin ')).toBe(ADMIN_ALLOWED_EMAIL)
    expect(resolveAdminLoginId('ADMIN')).toBe(ADMIN_ALLOWED_EMAIL)
  })

  it('passes through full admin email', () => {
    expect(resolveAdminLoginId('admin@twotwoshop.com')).toBe('admin@twotwoshop.com')
    expect(resolveAdminLoginId(' admin@twotwoshop.com ')).toBe('admin@twotwoshop.com')
  })

  it('passes through other login ids unchanged', () => {
    expect(resolveAdminLoginId('wrong-user')).toBe('wrong-user')
    expect(resolveAdminLoginId('other@example.com')).toBe('other@example.com')
  })
})

describe('isAllowedAdminEmail', () => {
  it('allows only the configured admin email', () => {
    expect(isAllowedAdminEmail('admin@twotwoshop.com')).toBe(true)
    expect(isAllowedAdminEmail(' Admin@twotwoshop.com ')).toBe(true)
    expect(isAllowedAdminEmail('other@example.com')).toBe(false)
    expect(isAllowedAdminEmail('admin')).toBe(false)
    expect(isAllowedAdminEmail(null)).toBe(false)
    expect(isAllowedAdminEmail(undefined)).toBe(false)
  })
})

describe('admin auth messages', () => {
  it('exposes required user-facing messages', () => {
    expect(ADMIN_INVALID_CREDENTIALS_MESSAGE).toBe(
      '아이디 또는 비밀번호가 올바르지 않습니다.',
    )
    expect(ADMIN_UNAUTHORIZED_MESSAGE).toBe('관리자 권한이 없습니다.')
  })
})
