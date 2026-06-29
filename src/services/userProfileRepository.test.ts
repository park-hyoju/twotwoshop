import { describe, expect, it } from 'vitest'
import { createAuthEmail, normalizeLoginEmail } from '../lib/customerAuthConfig'
import { resolveLoginEmail } from '../services/userProfileRepository'

describe('resolveLoginEmail', () => {
  it('returns email input as-is after normalization', async () => {
    await expect(resolveLoginEmail('  TestUser02@test.com ')).resolves.toBe('testuser02@test.com')
  })

  it('falls back to legacy virtual email for bare username without supabase', async () => {
    await expect(resolveLoginEmail('testuser01')).resolves.toBe(createAuthEmail('testuser01'))
  })

  it('returns empty string for blank input', async () => {
    await expect(resolveLoginEmail('   ')).resolves.toBe('')
  })

  it('allows special characters in email local-part', async () => {
    const email = 'user_name-1@test.com'
    expect(normalizeLoginEmail(email)).toBe(email)
    await expect(resolveLoginEmail(email)).resolves.toBe(email)
  })
})
