interface SolapiSendResult {
  mock: boolean
}

const FAIL_MESSAGE = '인증문자 발송에 실패했습니다.'

function resolveSmsDispatchUrl(): string {
  const configured = Deno.env.get('SMS_SEND_API_URL')?.trim()
  if (configured) {
    return configured.replace(/\/+$/, '')
  }

  // Production Vercel serverless function (SOLAPI credentials live on Vercel).
  return 'https://twotwoshop.vercel.app/api/send-verification-sms'
}

/**
 * Sends the password-reset verification SMS via the Vercel SOLAPI endpoint.
 * Never mocks success — SOLAPI must succeed for this to resolve.
 */
export async function sendVerificationSms(input: {
  phoneDigits: string
  code: string
}): Promise<SolapiSendResult> {
  const internalSecret = Deno.env.get('SMS_INTERNAL_SECRET')?.trim() ?? ''
  if (!internalSecret) {
    throw new Error(FAIL_MESSAGE)
  }

  const response = await fetch(resolveSmsDispatchUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-sms-internal-secret': internalSecret,
    },
    body: JSON.stringify({
      phone: input.phoneDigits,
      code: input.code,
    }),
  })

  let payload: { success?: boolean; message?: string } | null = null
  try {
    payload = (await response.json()) as { success?: boolean; message?: string }
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success !== true) {
    throw new Error(
      typeof payload?.message === 'string' && payload.message.trim()
        ? payload.message
        : FAIL_MESSAGE,
    )
  }

  return { mock: false }
}
