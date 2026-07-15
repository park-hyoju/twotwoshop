import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ADMIN_ROLE } from './adminAuthConfig'

const { mockMaybeSingle, mockFrom } = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn()
  const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
  const mockSelect = vi.fn(() => ({ eq: mockEq }))
  const mockFrom = vi.fn(() => ({ select: mockSelect }))
  return { mockMaybeSingle, mockFrom }
})

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: mockFrom,
  },
}))

import { hasAdminRoleInProfile, verifyAdminUser } from './adminAccess'

describe('verifyAdminUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
  })

  it('returns true when app_metadata.role is admin', async () => {
    const result = await verifyAdminUser({
      id: 'user-1',
      app_metadata: { role: ADMIN_ROLE },
      email: 'admintwotwo@twotwoshop.com',
    })

    expect(result).toBe(true)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('does not trust user_profiles.role when app_metadata is not admin', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { role: ADMIN_ROLE }, error: null })

    const result = await verifyAdminUser({
      id: 'user-2',
      app_metadata: {},
      email: 'member@example.com',
    })

    expect(result).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns false for non-admin users', async () => {
    const result = await verifyAdminUser({
      id: 'user-3',
      app_metadata: {},
      email: 'member@example.com',
    })

    expect(result).toBe(false)
  })

  it('ignores user_metadata.role (not inspected)', async () => {
    const result = await verifyAdminUser({
      id: 'user-5',
      app_metadata: {},
      email: 'member@example.com',
    })

    expect(result).toBe(false)
  })
})

describe('hasAdminRoleInProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false when profile lookup fails', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'column missing' } })

    await expect(hasAdminRoleInProfile('user-4')).resolves.toBe(false)
  })
})
