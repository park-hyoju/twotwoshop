import { describe, expect, it } from 'vitest'
import { ADMIN_ROLE } from '../lib/adminAuthConfig'
import { resolveAdminSessionState } from '../services/adminAuthService'

describe('resolveAdminSessionState', () => {
  it('returns null session for customer auth without signing out', () => {
    const result = resolveAdminSessionState({
      user: { email: 'testuser01@example.com', app_metadata: {} },
    } as never)

    expect(result.session).toBeNull()
    expect(result.unauthorized).toBe(false)
  })

  it('returns admin session when app_metadata.role is admin', () => {
    const adminSession = {
      user: { email: 'admin@twotwoshop.com', app_metadata: { role: ADMIN_ROLE } },
    } as never

    const result = resolveAdminSessionState(adminSession)
    expect(result.session).toBe(adminSession)
    expect(result.unauthorized).toBe(false)
  })

  it('rejects admin email without admin role', () => {
    const result = resolveAdminSessionState({
      user: { email: 'admin@twotwoshop.com', app_metadata: {} },
    } as never)

    expect(result.session).toBeNull()
    expect(result.unauthorized).toBe(false)
  })

  it('returns null for missing session', () => {
    expect(resolveAdminSessionState(null)).toEqual({
      session: null,
      unauthorized: false,
    })
  })
})
