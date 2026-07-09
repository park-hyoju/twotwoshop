/** 관리자 숫자 입력 필드용 파싱. 빈 문자열은 0으로 처리합니다. */
export function parseAdminNumericInput(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) {
    return 0
  }

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, Math.trunc(parsed))
}

/** DB/폼 숫자 값을 입력 필드 초기값 문자열로 변환합니다. 0은 빈칸으로 표시합니다. */
export function formatAdminNumericInput(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) {
    return ''
  }

  return String(value)
}

export interface AdminPricingNumericDraft {
  originalPrice: string
  price: string
  stock: string
  discountRate: string
}

export function createEmptyPricingDraft(): AdminPricingNumericDraft {
  return {
    originalPrice: '',
    price: '',
    stock: '',
    discountRate: '',
  }
}

export function pricingDraftFromForm(form: {
  original_price: number
  price: number
  stock: number
  discount_rate: number
}): AdminPricingNumericDraft {
  return {
    originalPrice: formatAdminNumericInput(form.original_price),
    price: formatAdminNumericInput(form.price),
    stock: formatAdminNumericInput(form.stock),
    discountRate: formatAdminNumericInput(form.discount_rate),
  }
}
