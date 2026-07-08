import { describe, expect, it } from 'vitest'
import {
  ADMIN_DEFAULT_EMAIL,
  ADMIN_LEGACY_EMAIL,
  ADMIN_ROLE,
  ADMIN_UNAUTHORIZED_MESSAGE,
  ADMIN_INVALID_CREDENTIALS_MESSAGE,
  isAdminAuthEmail,
  isAdminUser,
  resolveAdminLoginId,
} from './adminAuthConfig'

describe('isAdminAuthEmail', () => {
  it('identifies admin domain emails', () => {
    expect(isAdminAuthEmail('admintwotwo@twotwoshop.com')).toBe(true)
    expect(isAdminAuthEmail('admin@twotwoshop.com')).toBe(true)
    expect(isAdminAuthEmail('user01@twotwoshop.app')).toBe(false)
  })
})

describe('resolveAdminLoginId', () => {
  it('appends @twotwoshop.com when login id has no @', () => {
    expect(resolveAdminLoginId('admintwotwo')).toBe(ADMIN_DEFAULT_EMAIL)
    expect(resolveAdminLoginId(' admintwotwo ')).toBe(ADMIN_DEFAULT_EMAIL)
    expect(resolveAdminLoginId('AdminTwoTwo')).toBe(ADMIN_DEFAULT_EMAIL)
  })

  it('passes through full email when @ is included', () => {
    expect(resolveAdminLoginId('admin@twotwoshop.com')).toBe(ADMIN_LEGACY_EMAIL)
    expect(resolveAdminLoginId(' admintwotwo@twotwoshop.com ')).toBe(ADMIN_DEFAULT_EMAIL)
  })

  it('maps legacy admin alias to old email for migration', () => {
    expect(resolveAdminLoginId('admin')).toBe(ADMIN_LEGACY_EMAIL)
    expect(resolveAdminLoginId(' Admin ')).toBe(ADMIN_LEGACY_EMAIL)
    expect(resolveAdminLoginId('ADMIN')).toBe(ADMIN_LEGACY_EMAIL)
  })

  it('appends domain for other bare login ids', () => {
    expect(resolveAdminLoginId('other-admin')).toBe('other-admin@twotwoshop.com')
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
        email: ADMIN_DEFAULT_EMAIL,
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
