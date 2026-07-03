import { PASSWORD_RESET_SUCCESS_MESSAGE } from '../lib/passwordResetConfig'
import {
  EDGE_FUNCTION_PHONE_PASSWORD_RESET_COMPLETE,
  EDGE_FUNCTION_PHONE_PASSWORD_RESET_SEND,
  EDGE_FUNCTION_PHONE_PASSWORD_RESET_VERIFY,
} from '../lib/supabaseEdgeFunctions'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export class PhonePasswordResetError extends Error {
  code?: string
  cooldownSeconds?: number

  constructor(message: string, options?: { code?: string; cooldownSeconds?: number }) {
    super(message)
    this.name = 'PhonePasswordResetError'
    this.code = options?.code
    this.cooldownSeconds = options?.cooldownSeconds
  }
}

interface EdgeFunctionEnvelope<T> {
  ok: boolean
  message?: string
  code?: string
  cooldownSeconds?: number
  data?: T
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new PhonePasswordResetError(
      'Supabase 환경변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.',
    )
  }
}

async function parseEdgeFunctionError(error: unknown): Promise<{
  message: string
  code?: string
  cooldownSeconds?: number
}> {
  let message = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
  let code: string | undefined
  let cooldownSeconds: number | undefined

  const context = (error as { context?: Response }).context
  if (context?.status === 404) {
    return {
      message:
        '비밀번호 찾기 서비스를 찾을 수 없습니다. Supabase Edge Function이 배포되었는지 확인해주세요.',
      code: 'FUNCTION_NOT_FOUND',
    }
  }

  if (context) {
    try {
      const payload = (await context.json()) as EdgeFunctionEnvelope<unknown>
      if (typeof payload.message === 'string') {
        message = payload.message
      }
      if (typeof payload.code === 'string') {
        code = payload.code
      }
      if (typeof payload.cooldownSeconds === 'number') {
        cooldownSeconds = payload.cooldownSeconds
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  return { message, code, cooldownSeconds }
}

function assertEdgeFunctionSuccess<T extends EdgeFunctionEnvelope<unknown>>(
  payload: T | null,
): T {
  if (!payload || typeof payload !== 'object' || payload.ok !== true) {
    const message =
      payload && typeof payload.message === 'string'
        ? payload.message
        : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'

    throw new PhonePasswordResetError(message, {
      code: typeof payload?.code === 'string' ? payload.code : undefined,
      cooldownSeconds:
        typeof payload?.cooldownSeconds === 'number' ? payload.cooldownSeconds : undefined,
    })
  }

  return payload
}

export interface SendPasswordResetCodeResult {
  verificationId: string
  maskedPhone: string
  expiresAt: string
  mock?: boolean
  message: string
}

export async function sendPasswordResetCode(
  identifier: string,
): Promise<SendPasswordResetCodeResult> {
  assertSupabaseReady()

  const trimmed = identifier.trim()
  if (!trimmed) {
    throw new PhonePasswordResetError('아이디 또는 전화번호를 입력해주세요.')
  }

  const { data, error } = await supabase!.functions.invoke(EDGE_FUNCTION_PHONE_PASSWORD_RESET_SEND, {
    body: { identifier: trimmed },
  })

  if (error) {
    const parsed = await parseEdgeFunctionError(error)
    throw new PhonePasswordResetError(parsed.message, {
      code: parsed.code,
      cooldownSeconds: parsed.cooldownSeconds,
    })
  }

  const payload = assertEdgeFunctionSuccess(
    data as SendPasswordResetCodeResult & EdgeFunctionEnvelope<unknown>,
  )

  return {
    verificationId: payload.verificationId,
    maskedPhone: payload.maskedPhone,
    expiresAt: payload.expiresAt,
    mock: payload.mock,
    message: payload.message ?? '인증번호를 발송했습니다.',
  }
}

export interface VerifyPasswordResetCodeResult {
  resetToken: string
  resetTokenExpiresAt: string
  message: string
}

export async function verifyPasswordResetCode(
  verificationId: string,
  code: string,
): Promise<VerifyPasswordResetCodeResult> {
  assertSupabaseReady()

  const trimmedCode = code.trim()

  if (!verificationId.trim()) {
    throw new PhonePasswordResetError('인증 요청 정보가 없습니다.')
  }

  if (!/^\d{6}$/.test(trimmedCode)) {
    throw new PhonePasswordResetError('6자리 인증번호를 입력해주세요.')
  }

  const { data, error } = await supabase!.functions.invoke(
    EDGE_FUNCTION_PHONE_PASSWORD_RESET_VERIFY,
    {
      body: {
        verificationId: verificationId.trim(),
        code: trimmedCode,
      },
    },
  )

  if (error) {
    const parsed = await parseEdgeFunctionError(error)
    throw new PhonePasswordResetError(parsed.message, {
      code: parsed.code,
      cooldownSeconds: parsed.cooldownSeconds,
    })
  }

  const payload = assertEdgeFunctionSuccess(
    data as VerifyPasswordResetCodeResult & EdgeFunctionEnvelope<unknown>,
  )

  return {
    resetToken: payload.resetToken,
    resetTokenExpiresAt: payload.resetTokenExpiresAt,
    message: payload.message ?? '인증이 완료되었습니다.',
  }
}

export async function completePasswordResetByPhone(input: {
  resetToken: string
  newPassword: string
  confirmPassword: string
}): Promise<string> {
  assertSupabaseReady()

  if (!input.resetToken.trim()) {
    throw new PhonePasswordResetError('인증 정보가 만료되었습니다. 다시 시도해주세요.')
  }

  const { data, error } = await supabase!.functions.invoke(
    EDGE_FUNCTION_PHONE_PASSWORD_RESET_COMPLETE,
    {
      body: {
        resetToken: input.resetToken.trim(),
        newPassword: input.newPassword,
        confirmPassword: input.confirmPassword,
      },
    },
  )

  if (error) {
    const parsed = await parseEdgeFunctionError(error)
    throw new PhonePasswordResetError(parsed.message, {
      code: parsed.code,
      cooldownSeconds: parsed.cooldownSeconds,
    })
  }

  const payload = assertEdgeFunctionSuccess(
    data as { message: string } & EdgeFunctionEnvelope<unknown>,
  )

  return payload.message ?? PASSWORD_RESET_SUCCESS_MESSAGE
}

export function isPhonePasswordResetRateLimitError(error: unknown): boolean {
  return error instanceof PhonePasswordResetError && error.code === 'RESEND_COOLDOWN'
}

export function isPhonePasswordResetBlockedError(error: unknown): boolean {
  return error instanceof PhonePasswordResetError && error.code === 'VERIFY_BLOCKED'
}

export function getPhonePasswordResetErrorMessage(error: unknown): string {
  if (error instanceof PhonePasswordResetError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
}
