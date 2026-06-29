import { describe, expect, it } from 'vitest'
import { formatPhoneDisplay } from './formatters'
import {
  clampQuantity,
  parsePositiveInteger,
  parsePrice,
  sanitizeEmail,
  sanitizePhone,
  sanitizeText,
  sanitizeZipcode,
} from './sanitize'
import { createSubmitGuard, runGuardedSubmit } from './submitGuard'
import { INITIAL_CHECKOUT_FORM } from '../types/order'
import {
  hasCheckoutFormErrors,
  validateCheckoutForm,
  validateCustomerAddressInput,
  validateEmail,
  validateInquiryFormInput,
  validateMemberProfileInput,
  validatePassword,
  validatePersonName,
  validatePhone,
  validatePrice,
  validateQuantity,
  validateSearchQuery,
  validateZipcode,
} from './validators'

describe('sanitize', () => {
  it('removes non-digit characters from phone numbers', () => {
    expect(sanitizePhone('010-1234-5678')).toBe('01012345678')
    expect(sanitizePhone('abc')).toBe('')
  })

  it('normalizes email with trim and lowercase', () => {
    expect(sanitizeEmail('  Test@Example.COM ')).toBe('test@example.com')
  })

  it('limits zipcode to 5 digits', () => {
    expect(sanitizeZipcode('123456')).toBe('12345')
  })

  it('strips script tags from text', () => {
    expect(sanitizeText('<script>alert(1)</script>안녕')).toBe('안녕')
  })

  it('truncates very long text', () => {
    expect(sanitizeText('a'.repeat(10001)).length).toBe(10000)
  })
})

describe('validators', () => {
  it('rejects empty values', () => {
    expect(validatePersonName('', { fieldLabel: '주문자 이름' })).toBe('주문자 이름을(를) 입력해주세요.')
    expect(validatePhone('')).toBe('연락처를 입력해주세요.')
  })

  it('rejects whitespace-only values', () => {
    expect(validatePersonName('   ', { fieldLabel: '주문자 이름' })).toBe('주문자 이름을(를) 입력해주세요.')
    expect(validateSearchQuery('   ')).toBe('검색어를 입력해주세요.')
  })

  it('rejects phone numbers with letters', () => {
    expect(validatePhone('010abcd5678')).toBe('연락처는 10~11자리로 입력해주세요.')
  })

  it('rejects 9-digit and 12-digit phone numbers', () => {
    expect(validatePhone('010123456')).toBe('연락처는 10~11자리로 입력해주세요.')
    expect(validatePhone('010123456789')).toBe('연락처는 10~11자리로 입력해주세요.')
  })

  it('accepts valid phone numbers', () => {
    expect(validatePhone('01012345678')).toBeNull()
    expect(sanitizePhone('010-1234-5678')).toBe('01012345678')
  })

  it('rejects email without @', () => {
    expect(validateEmail('invalid-email')).toBe('올바른 이메일 형식을 입력해주세요.')
  })

  it('rejects invalid zipcode lengths', () => {
    expect(validateZipcode('1234')).toBe('우편번호는 숫자 5자리로 입력해주세요.')
    expect(validateZipcode('123456')).toBe('우편번호는 숫자 5자리로 입력해주세요.')
  })

  it('rejects negative quantity and zero price', () => {
    expect(validateQuantity(-1)).toBe('수량은(는) 0보다 커야 합니다.')
    expect(validatePrice(0)).toBe('가격은 0원보다 커야 합니다.')
    expect(parsePrice(0)).toBeNull()
    expect(parsePositiveInteger(-3)).toBeNull()
  })

  it('rejects script tag input in inquiry message', () => {
    expect(
      validateInquiryFormInput({
        customerName: '홍길동',
        customerPhone: '01012345678',
        message: '<script>alert(1)</script>문의합니다',
      }),
    ).toBe('사용할 수 없는 문자가 포함되어 있습니다.')
  })

  it('accepts valid checkout and address input', () => {
    const checkoutErrors = validateCheckoutForm({
      ...INITIAL_CHECKOUT_FORM,
      customerName: '홍길동',
      customerPhone: '01012345678',
      postalCode: '12345',
      address: '서울시 강남구 테헤란로',
      addressDetail: '101호',
      sameAsOrdererForDepositor: true,
      sameAsOrdererForRecipient: true,
      agreedOrder: true,
      agreedPrivacy: true,
    })

    expect(hasCheckoutFormErrors(checkoutErrors)).toBe(false)

    const addressErrors = validateCustomerAddressInput({
      label: '집',
      recipientName: '홍길동',
      phone: '01012345678',
      zipcode: '12345',
      address1: '서울시 강남구',
      address2: '101호',
    })

    expect(Object.keys(addressErrors)).toHaveLength(0)
    expect(validateMemberProfileInput({ name: '홍길동', phone: '01012345678' })).toBeNull()
    expect(validatePassword('password123')).toBeNull()
  })
})

describe('formatters', () => {
  it('formats phone numbers for display only', () => {
    expect(formatPhoneDisplay('01012345678')).toBe('010-1234-5678')
  })
})

describe('submitGuard', () => {
  it('prevents concurrent submit', async () => {
    const guard = createSubmitGuard()
    let running = 0
    let maxConcurrent = 0

    const task = () =>
      guard.run(async () => {
        running += 1
        maxConcurrent = Math.max(maxConcurrent, running)
        await new Promise((resolve) => setTimeout(resolve, 20))
        running -= 1
        return 'ok'
      })

    const [first, second] = await Promise.all([task(), task()])

    expect(maxConcurrent).toBe(1)
    expect([first, second].filter(Boolean)).toHaveLength(1)
  })

  it('blocks repeated submit while loading', async () => {
    let submitCount = 0
    let isSubmitting = false

    const setIsSubmitting = (value: boolean) => {
      isSubmitting = value
    }

    const submit = () =>
      runGuardedSubmit(isSubmitting, setIsSubmitting, async () => {
        submitCount += 1
        await new Promise((resolve) => setTimeout(resolve, 20))
      })

    await Promise.all([submit(), submit(), submit()])
    expect(submitCount).toBe(1)
  })
})

describe('cart quantity', () => {
  it('clamps invalid quantities to valid range', () => {
    expect(clampQuantity(-5, 10)).toBe(1)
    expect(clampQuantity(99, 10)).toBe(10)
    expect(clampQuantity(3, 10)).toBe(3)
  })
})
