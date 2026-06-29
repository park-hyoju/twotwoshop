import { describe, expect, it } from 'vitest'
import {
  createAuthEmail,
  CUSTOMER_EMAIL_ALREADY_REGISTERED_MESSAGE,
  CUSTOMER_EMAIL_NOT_CONFIRMED_MESSAGE,
  CUSTOMER_INVALID_CREDENTIALS_MESSAGE,
  CUSTOMER_RATE_LIMIT_MESSAGE,
  CUSTOMER_SIGNUP_EMAIL_CONFIRMATION_MESSAGE,
  extractUsernameFromAuthEmail,
  isAuthRateLimitError,
  isAuthRateLimitMessage,
  isCustomerAuthEmail,
  isVirtualCustomerAuthEmail,
  mapCustomerAuthErrorMessage,
  normalizeLoginEmail,
  parseRateLimitCooldownSeconds,
} from './customerAuthConfig'

describe('customerAuthConfig', () => {
  it('creates virtual auth email from username', () => {
    expect(createAuthEmail('juju123')).toBe('juju123@example.com')
    expect(createAuthEmail('JuJu123')).toBe('juju123@example.com')
    expect(createAuthEmail('testuser01')).toBe('testuser01@example.com')
  })

  it('normalizes login email input', () => {
    expect(normalizeLoginEmail('  TestUser02@test.com  ')).toBe('testuser02@test.com')
    expect(normalizeLoginEmail('user_name-1@test.co.kr')).toBe('user_name-1@test.co.kr')
  })

  it('preserves @ . _ - characters in login email', () => {
    const value = 'a_b-c.d@te-st.com'
    expect(normalizeLoginEmail(value)).toBe(value)
    expect(value.includes('@')).toBe(true)
    expect(value.includes('.')).toBe(true)
    expect(value.includes('_')).toBe(true)
    expect(value.includes('-')).toBe(true)
  })

  it('extracts username local-part from any customer email', () => {
    expect(extractUsernameFromAuthEmail('juju123@example.com')).toBe('juju123')
    expect(extractUsernameFromAuthEmail('testuser02@test.com')).toBe('testuser02')
    expect(extractUsernameFromAuthEmail('admin@twotwoshop.com')).toBe('admin')
  })

  it('identifies customer auth emails including real domains', () => {
    expect(isCustomerAuthEmail('admin@twotwoshop.com')).toBe(true)
    expect(isCustomerAuthEmail('member01@example.com')).toBe(true)
    expect(isCustomerAuthEmail('testuser02@test.com')).toBe(true)
    expect(isVirtualCustomerAuthEmail('testuser02@test.com')).toBe(false)
    expect(isVirtualCustomerAuthEmail('testuser01@example.com')).toBe(true)
  })

  it('detects auth rate limit messages', () => {
    expect(isAuthRateLimitMessage('email rate limit exceeded')).toBe(true)
    expect(isAuthRateLimitMessage('Too Many Requests')).toBe(true)
    expect(
      isAuthRateLimitMessage('For security purposes, you can only request this after 52 seconds.'),
    ).toBe(true)
  })

  it('parses rate limit cooldown seconds from message', () => {
    expect(
      parseRateLimitCooldownSeconds(
        'For security purposes, you can only request this after 52 seconds.',
      ),
    ).toBe(52)
    expect(parseRateLimitCooldownSeconds('email rate limit exceeded')).toBeNull()
  })

  it('maps auth errors to user-friendly messages', () => {
    expect(mapCustomerAuthErrorMessage('Invalid login credentials', 'signin')).toBe(
      CUSTOMER_INVALID_CREDENTIALS_MESSAGE,
    )
    expect(mapCustomerAuthErrorMessage('email rate limit exceeded', 'signup')).toBe(
      CUSTOMER_RATE_LIMIT_MESSAGE,
    )
    expect(mapCustomerAuthErrorMessage('User already registered', 'signup')).toBe(
      CUSTOMER_EMAIL_ALREADY_REGISTERED_MESSAGE,
    )
    expect(mapCustomerAuthErrorMessage('Email not confirmed', 'signin')).toBe(
      CUSTOMER_EMAIL_NOT_CONFIRMED_MESSAGE,
    )
    expect(CUSTOMER_EMAIL_NOT_CONFIRMED_MESSAGE).toContain('이메일 인증')
    expect(mapCustomerAuthErrorMessage('Email not confirmed', 'signup')).toBe(
      CUSTOMER_SIGNUP_EMAIL_CONFIRMATION_MESSAGE,
    )
    expect(
      mapCustomerAuthErrorMessage(
        'For security purposes, you can only request this after 52 seconds.',
        'signup',
      ),
    ).toBe(CUSTOMER_RATE_LIMIT_MESSAGE)
    expect(
      isAuthRateLimitError({
        status: 429,
        message: 'For security purposes, you can only request this after 52 seconds.',
      }),
    ).toBe(true)
  })
})
