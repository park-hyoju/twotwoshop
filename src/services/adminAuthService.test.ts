import { describe, expect, it, vi } from 'vitest'
import { ADMIN_ROLE } from '../lib/adminAuthConfig'

vi.mock('../lib/adminAccess', () => ({
  verifyAdminUser: vi.fn(async (user: { app_metadata?: { role?: string } } | null | undefined) => {
    if (!user) {
      return false
    }

    return user.app_metadata?.role === ADMIN_ROLE
  }),
}))

import { resolveAdminSessionState } from '../services/adminAuthService'

describe('resolveAdminSessionState', () => {
  it('returns null session for customer auth without signing out', async () => {
    const result = await resolveAdminSessionState({
      user: { email: 'testuser01@example.com', app_metadata: {} },
    } as never)

    expect(result.session).toBeNull()
    expect(result.unauthorized).toBe(true)
  })

  it('returns admin session when app_metadata.role is admin', async () => {
    const adminSession = {
      user: { email: 'admintwotwo@twotwoshop.com', app_metadata: { role: ADMIN_ROLE } },
    } as never

    const result = await resolveAdminSessionState(adminSession)
    expect(result.session).toBe(adminSession)
    expect(result.unauthorized).toBe(false)
  })

  it('rejects admin email without admin role', async () => {
    const result = await resolveAdminSessionState({
      user: { email: 'admintwotwo@twotwoshop.com', app_metadata: {} },
    } as never)

    expect(result.session).toBeNull()
    expect(result.unauthorized).toBe(true)
  })

  it('returns null for missing session', async () => {
    await expect(resolveAdminSessionState(null)).resolves.toEqual({
      session: null,
      unauthorized: false,
    })
  })
})
