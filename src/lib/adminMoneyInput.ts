/** 숫자만 추출해 정수로 파싱 (빈 문자열 → null). */
export function parseKoreanWonInput(value: string): number | null {
  const digits = value.replace(/[^\d]/g, '')
  if (!digits) {
    return null
  }

  const parsed = Number.parseInt(digits, 10)
  return Number.isFinite(parsed) ? parsed : null
}

/** 화면 표시용 원화 포맷 (예: 59000 → "59,000원"). */
export function formatKoreanWonDisplay(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) {
    return ''
  }

  return `${amount.toLocaleString('ko-KR')}원`
}
