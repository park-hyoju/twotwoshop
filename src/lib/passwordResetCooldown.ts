import { useCallback, useEffect, useState } from 'react'

export const PASSWORD_RESET_COOLDOWN_STORAGE_KEY = 'password_reset_cooldown_until'

export const PASSWORD_RESET_SUCCESS_COOLDOWN_SECONDS = 60

export const PASSWORD_RESET_RATE_LIMIT_COOLDOWN_SECONDS = 5 * 60

export const PASSWORD_RESET_RATE_LIMIT_MESSAGE =
  '인증번호 요청이 잠시 제한되었습니다. 잠시 후 다시 시도해주세요.'

function getLocalStorage(): Storage | null {
  try {
    if (typeof globalThis.localStorage !== 'undefined') {
      return globalThis.localStorage
    }
  } catch {
    return null
  }

  return null
}

function readCooldownUntilMs(): number | null {
  const storage = getLocalStorage()
  if (!storage) {
    return null
  }

  try {
    const raw = storage.getItem(PASSWORD_RESET_COOLDOWN_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  } catch {
    return null
  }
}

export function getPasswordResetCooldownRemainingSeconds(): number {
  const untilMs = readCooldownUntilMs()
  if (!untilMs) {
    return 0
  }

  const remainingMs = untilMs - Date.now()
  if (remainingMs <= 0) {
    clearPasswordResetCooldown()
    return 0
  }

  return Math.ceil(remainingMs / 1000)
}

export function setPasswordResetCooldown(durationSeconds: number): void {
  const storage = getLocalStorage()
  if (!storage || durationSeconds <= 0) {
    return
  }

  const untilMs = Date.now() + durationSeconds * 1000
  storage.setItem(PASSWORD_RESET_COOLDOWN_STORAGE_KEY, String(untilMs))
}

export function clearPasswordResetCooldown(): void {
  const storage = getLocalStorage()
  if (!storage) {
    return
  }

  try {
    storage.removeItem(PASSWORD_RESET_COOLDOWN_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

export function formatPasswordResetCooldownButtonLabel(
  remainingSeconds: number,
  idleLabel = '인증번호 받기',
): string {
  if (remainingSeconds <= 0) {
    return idleLabel
  }

  return `${remainingSeconds}초 후 다시 요청 가능`
}

export function usePasswordResetCooldown() {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getPasswordResetCooldownRemainingSeconds(),
  )

  useEffect(() => {
    function syncRemaining() {
      setRemainingSeconds(getPasswordResetCooldownRemainingSeconds())
    }

    syncRemaining()
    const timerId = window.setInterval(syncRemaining, 1000)
    return () => window.clearInterval(timerId)
  }, [])

  const startSuccessCooldown = useCallback(() => {
    setPasswordResetCooldown(PASSWORD_RESET_SUCCESS_COOLDOWN_SECONDS)
    setRemainingSeconds(PASSWORD_RESET_SUCCESS_COOLDOWN_SECONDS)
  }, [])

  const startRateLimitCooldown = useCallback(() => {
    setPasswordResetCooldown(PASSWORD_RESET_RATE_LIMIT_COOLDOWN_SECONDS)
    setRemainingSeconds(PASSWORD_RESET_RATE_LIMIT_COOLDOWN_SECONDS)
  }, [])

  return {
    remainingSeconds,
    isCooldownActive: remainingSeconds > 0,
    startSuccessCooldown,
    startRateLimitCooldown,
  }
}
