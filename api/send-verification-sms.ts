import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SolapiMessageService } from 'solapi'

const FAIL_MESSAGE = '인증문자 발송에 실패했습니다. 잠시 후 다시 시도해주세요.'

function normalizePhone(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }
  return value.replace(/[^\d]/g, '')
}

function isKoreanMobilePhone(digits: string): boolean {
  return /^01[016789]\d{7,8}$/.test(digits)
}

function isSixDigitCode(value: unknown): value is string {
  return typeof value === 'string' && /^\d{6}$/.test(value)
}

function getHeaderValue(
  headers: VercelRequest['headers'],
  name: string,
): string {
  const value = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? ''
  }
  return typeof value === 'string' ? value.trim() : ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: FAIL_MESSAGE })
    return
  }

  const expectedSecret = process.env.SMS_INTERNAL_SECRET?.trim() ?? ''
  const providedSecret = getHeaderValue(req.headers, 'x-sms-internal-secret')

  if (!expectedSecret || providedSecret !== expectedSecret) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
    const phone = normalizePhone(body.phone)
    const code = body.code

    if (!isKoreanMobilePhone(phone) || !isSixDigitCode(code)) {
      res.status(400).json({ success: false, message: FAIL_MESSAGE })
      return
    }

    const apiKey = process.env.SOLAPI_API_KEY
    const apiSecret = process.env.SOLAPI_API_SECRET
    const from = process.env.SOLAPI_FROM

    if (!apiKey || !apiSecret || !from) {
      res.status(500).json({ success: false, message: FAIL_MESSAGE })
      return
    }

    const text = `[투투샵] 비밀번호 찾기 인증번호는 ${code}입니다.\n5분 이내 입력해주세요.`
    const messageService = new SolapiMessageService(apiKey, apiSecret)
    await messageService.send({
      to: phone,
      from,
      text,
    })

    res.status(200).json({ success: true })
  } catch {
    res.status(500).json({ success: false, message: FAIL_MESSAGE })
  }
}
