import { describe, expect, it } from 'vitest'
import {
  ADMIN_ROLE,
  ADMIN_UNAUTHORIZED_MESSAGE,
  ADMIN_INVALID_CREDENTIALS_MESSAGE,
  isAdminUser,
  resolveAdminLoginId,
} from './adminAuthConfig'

describe('resolveAdminLoginId', () => {
  it('maps admin alias to allowed email', () => {
    expect(resolveAdminLoginId('admin')).toBe('admin@twotwoshop.com')
    expect(resolveAdminLoginId(' Admin ')).toBe('admin@twotwoshop.com')
    expect(resolveAdminLoginId('ADMIN')).toBe('admin@twotwoshop.com')
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

describe('isAdminUser', () => {
  it('allows only JWT app_metadata.role = admin', () => {
    expect(isAdminUser({ app_metadata: { role: ADMIN_ROLE } })).toBe(true)
    expect(isAdminUser({ app_metadata: { role: 'user' } })).toBe(false)
    expect(isAdminUser({ app_metadata: {} })).toBe(false)
    expect(isAdminUser({ app_metadata: undefined })).toBe(false)
    expect(isAdminUser(null)).toBe(false)
  })

  it('does not grant admin by email alone', () => {
    expect(
      isAdminUser({
        email: 'admin@twotwoshop.com',
        app_metadata: {},
      } as never),
    ).toBe(false)
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
