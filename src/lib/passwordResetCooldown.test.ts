import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearPasswordResetCooldown,
  formatPasswordResetCooldownButtonLabel,
  getPasswordResetCooldownRemainingSeconds,
  PASSWORD_RESET_COOLDOWN_STORAGE_KEY,
  PASSWORD_RESET_RATE_LIMIT_COOLDOWN_SECONDS,
  PASSWORD_RESET_SUCCESS_COOLDOWN_SECONDS,
  setPasswordResetCooldown,
} from './passwordResetCooldown'

describe('passwordResetCooldown', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-17T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('stores a 60 second cooldown after success', () => {
    setPasswordResetCooldown(PASSWORD_RESET_SUCCESS_COOLDOWN_SECONDS)

    expect(getPasswordResetCooldownRemainingSeconds()).toBe(60)
    expect(storage.get(PASSWORD_RESET_COOLDOWN_STORAGE_KEY)).toBe(
      String(Date.now() + 60_000),
    )
  })

  it('clears expired cooldown and returns zero remaining seconds', () => {
    setPasswordResetCooldown(PASSWORD_RESET_SUCCESS_COOLDOWN_SECONDS)
    vi.advanceTimersByTime(61_000)

    expect(getPasswordResetCooldownRemainingSeconds()).toBe(0)
    expect(storage.has(PASSWORD_RESET_COOLDOWN_STORAGE_KEY)).toBe(false)
  })

  it('supports a 5 minute rate-limit cooldown', () => {
    setPasswordResetCooldown(PASSWORD_RESET_RATE_LIMIT_COOLDOWN_SECONDS)

    expect(getPasswordResetCooldownRemainingSeconds()).toBe(300)
  })

  it('formats button labels for default and cooldown states', () => {
    expect(formatPasswordResetCooldownButtonLabel(0)).toBe('인증번호 받기')
    expect(formatPasswordResetCooldownButtonLabel(59)).toBe('59초 후 다시 요청 가능')
  })

  it('can clear cooldown manually', () => {
    setPasswordResetCooldown(PASSWORD_RESET_SUCCESS_COOLDOWN_SECONDS)
    clearPasswordResetCooldown()

    expect(getPasswordResetCooldownRemainingSeconds()).toBe(0)
  })
})
