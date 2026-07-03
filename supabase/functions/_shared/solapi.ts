interface SolapiSendResult {
  mock: boolean
}

function hasSolapiCredentials(): boolean {
  return Boolean(
    Deno.env.get('SOLAPI_API_KEY') &&
      Deno.env.get('SOLAPI_API_SECRET') &&
      Deno.env.get('SOLAPI_SENDER_NUMBER'),
  )
}

async function createSolapiAuthorizationHeader(
  apiKey: string,
  apiSecret: string,
): Promise<string> {
  const date = new Date().toISOString()
  const salt = crypto.randomUUID().replace(/-/g, '')
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(date + salt),
  )
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
}

export async function sendVerificationSms(input: {
  phoneDigits: string
  code: string
}): Promise<SolapiSendResult> {
  const message = `[TWOTWOSHOP] 비밀번호 찾기 인증번호는 [${input.code}] 입니다. 3분 내에 입력해주세요.`

  if (!hasSolapiCredentials()) {
    console.info('[phone-password-reset][mock-sms]', {
      to: input.phoneDigits,
      message,
    })
    return { mock: true }
  }

  const apiKey = Deno.env.get('SOLAPI_API_KEY')!
  const apiSecret = Deno.env.get('SOLAPI_API_SECRET')!
  const sender = Deno.env.get('SOLAPI_SENDER_NUMBER')!
  const authorization = await createSolapiAuthorizationHeader(apiKey, apiSecret)

  const response = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        to: input.phoneDigits,
        from: sender,
        text: message,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`SOLAPI send failed (${response.status}): ${body}`)
  }

  return { mock: false }
}
