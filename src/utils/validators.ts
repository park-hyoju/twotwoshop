import type { CheckoutFormData, CheckoutFormErrors } from '../types/order'
import type { CustomerAddressInput } from '../types/mypage'
import {
  DISPLAY_NAME_MAX_LENGTH,
  MAX_ADDRESS_DETAIL_LENGTH,
  MAX_ADDRESS_LABEL_LENGTH,
  MAX_ADDRESS_LINE_LENGTH,
  MAX_ADMIN_REPLY_LENGTH,
  MAX_BANNER_BUTTON_TEXT_LENGTH,
  MAX_BANNER_DESCRIPTION_LENGTH,
  MAX_BANNER_EYEBROW_LENGTH,
  MAX_BANNER_TITLE_LENGTH,
  MAX_INQUIRY_MESSAGE_LENGTH,
  MAX_MEMO_LENGTH,
  MAX_NAME_LENGTH,
  MAX_NOTICE_CONTENT_LENGTH,
  MAX_NOTICE_TITLE_LENGTH,
  MAX_ORDER_REFERENCE_LENGTH,
  MAX_SEARCH_LENGTH,
  MIN_NAME_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from './constants'
import {
  sanitizeEmail,
  sanitizeOptionalText,
  sanitizePhone,
  sanitizeSearchQuery,
  sanitizeText,
  sanitizeZipcode,
} from './sanitize'

export type ValidationResult = string | null
export type FieldErrors<T extends string> = Partial<Record<T, string>>

export {
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
}

const USERNAME_PATTERN = /^[a-z0-9]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PERSON_NAME_PATTERN = /^[가-힣a-zA-Z]{2,10}$/
const RESERVED_USERNAMES = new Set(['admin'])

export function isBlank(value: string): boolean {
  return sanitizeText(value).length === 0
}

export function hasFieldErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.trim().toLowerCase())
}

export function validateRequired(value: string, message: string): ValidationResult {
  return isBlank(value) ? message : null
}

export function validatePhone(
  phone: string,
  options?: { required?: boolean; fieldLabel?: string },
): ValidationResult {
  const digits = phone.replace(/\D/g, '')
  const label = options?.fieldLabel ?? '연락처'

  if (!digits) {
    return options?.required === false ? null : `${label}를 입력해주세요.`
  }

  if (digits.length < 10 || digits.length > 11) {
    return `${label}는 10~11자리로 입력해주세요.`
  }

  return null
}

export function validateEmail(
  email: string,
  options?: { required?: boolean },
): ValidationResult {
  const normalized = sanitizeEmail(email)

  if (!normalized) {
    return options?.required ? '이메일을 입력해주세요.' : null
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return '올바른 이메일 형식을 입력해주세요.'
  }

  return null
}

export function validatePersonName(
  name: string,
  options?: { fieldLabel?: string },
): ValidationResult {
  const trimmed = sanitizeText(name, { maxLength: MAX_NAME_LENGTH })
  const label = options?.fieldLabel ?? '이름'

  if (!trimmed) {
    return `${label}을(를) 입력해주세요.`
  }

  if (!PERSON_NAME_PATTERN.test(trimmed)) {
    return `${label}은(는) 한글 또는 영문 2~10자로 입력해주세요.`
  }

  return null
}

export function validateName(
  name: string,
  options?: { minLength?: number; maxLength?: number; fieldLabel?: string },
): ValidationResult {
  const minLength = options?.minLength ?? MIN_NAME_LENGTH
  const maxLength = options?.maxLength ?? MAX_NAME_LENGTH
  const label = options?.fieldLabel ?? '이름'
  const trimmed = sanitizeText(name, { maxLength })

  if (!trimmed) {
    return `${label}을(를) 입력해주세요.`
  }

  if (trimmed.length < minLength) {
    return `${label}은(는) ${minLength}자 이상 입력해주세요.`
  }

  if (/\s{2,}/.test(trimmed)) {
    return '공백은 한 칸만 사용해주세요.'
  }

  if (/[<>{}[\]\\|`~]/.test(trimmed)) {
    return '사용할 수 없는 특수문자가 포함되어 있습니다.'
  }

  return null
}

export function validateZipcode(zipcode: string): ValidationResult {
  const digits = zipcode.replace(/\D/g, '')

  if (!digits) {
    return '우편번호를 입력해주세요.'
  }

  if (digits.length !== 5) {
    return '우편번호는 숫자 5자리로 입력해주세요.'
  }

  return null
}

export function validateAddressLine(
  value: string,
  fieldLabel: string,
  minLength = 2,
): ValidationResult {
  const trimmed = sanitizeText(value, { maxLength: MAX_ADDRESS_LINE_LENGTH })

  if (!trimmed) {
    return `${fieldLabel}을(를) 입력해주세요.`
  }

  if (trimmed.length < minLength) {
    return `${fieldLabel}을(를) 입력해주세요.`
  }

  return null
}

export function validateAddressDetail(value: string): ValidationResult {
  const trimmed = sanitizeText(value, { maxLength: MAX_ADDRESS_DETAIL_LENGTH })

  if (!trimmed) {
    return '상세주소를 입력해주세요.'
  }

  if (trimmed.length < 2) {
    return '상세주소를 입력해주세요.'
  }

  return null
}

export function validateTextContent(
  value: string,
  options: {
    fieldLabel: string
    minLength?: number
    maxLength: number
    required?: boolean
  },
): ValidationResult {
  const trimmed = sanitizeText(value, { maxLength: options.maxLength })
  const required = options.required ?? true

  if (!trimmed) {
    return required ? `${options.fieldLabel}을(를) 입력해주세요.` : null
  }

  if (options.minLength && trimmed.length < options.minLength) {
    return `${options.fieldLabel}은(는) ${options.minLength}자 이상 입력해주세요.`
  }

  if (value.includes('<script') || value.includes('</script>')) {
    return '사용할 수 없는 문자가 포함되어 있습니다.'
  }

  return null
}

export function validatePositiveNumber(value: number, fieldLabel: string): ValidationResult {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return `${fieldLabel}은(는) 숫자로 입력해주세요.`
  }

  if (value <= 0) {
    return `${fieldLabel}은(는) 0보다 커야 합니다.`
  }

  return null
}

export function validateNonNegativeInteger(value: number, fieldLabel: string): ValidationResult {
  if (!Number.isInteger(value) || !Number.isFinite(value) || Number.isNaN(value)) {
    return `${fieldLabel}은(는) 숫자로 입력해주세요.`
  }

  if (value < 0) {
    return `${fieldLabel}은(는) 0 이상이어야 합니다.`
  }

  return null
}

export function validateQuantity(quantity: number, max?: number): ValidationResult {
  const baseError = validatePositiveNumber(quantity, '수량')
  if (baseError) {
    return baseError
  }

  if (!Number.isInteger(quantity)) {
    return '수량은 정수로 입력해주세요.'
  }

  if (max !== undefined && quantity > max) {
    return `수량은 최대 ${max}개까지 가능합니다.`
  }

  return null
}

export function validatePrice(price: number): ValidationResult {
  if (!Number.isFinite(price) || Number.isNaN(price)) {
    return '가격은 숫자로 입력해주세요.'
  }

  if (!Number.isInteger(price)) {
    return '가격은 정수(원)로 입력해주세요.'
  }

  if (price <= 0) {
    return '가격은 0원보다 커야 합니다.'
  }

  return null
}

export function validateUsername(username: string): ValidationResult {
  const normalized = username.trim().toLowerCase()

  if (!normalized) {
    return '아이디를 입력해주세요.'
  }

  if (normalized.length < USERNAME_MIN_LENGTH || normalized.length > USERNAME_MAX_LENGTH) {
    return `아이디는 ${USERNAME_MIN_LENGTH}~${USERNAME_MAX_LENGTH}자의 영문 소문자와 숫자만 사용할 수 있습니다.`
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return '아이디는 영문 소문자와 숫자만 사용할 수 있습니다.'
  }

  if (isReservedUsername(normalized)) {
    return '사용할 수 없는 아이디입니다.'
  }

  return null
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return '비밀번호를 입력해주세요.'
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`
  }

  return null
}

export function validateSignupPassword(password: string): ValidationResult {
  const baseError = validatePassword(password)
  if (baseError) {
    return baseError
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return '비밀번호는 영문과 숫자를 모두 포함해야 합니다.'
  }

  return null
}

export function validatePasswordConfirm(password: string, passwordConfirm: string): ValidationResult {
  if (!passwordConfirm) {
    return '비밀번호 확인을 입력해주세요.'
  }

  if (password !== passwordConfirm) {
    return '비밀번호가 일치하지 않습니다.'
  }

  return null
}

export function validateDisplayName(displayName: string): ValidationResult {
  const trimmed = sanitizeText(displayName, { maxLength: DISPLAY_NAME_MAX_LENGTH })

  if (!trimmed) {
    return '이름 또는 닉네임을 입력해주세요.'
  }

  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return `이름 또는 닉네임은 ${DISPLAY_NAME_MAX_LENGTH}자 이하로 입력해주세요.`
  }

  return null
}

export interface CustomerSignUpInput {
  loginId: string
  optionalEmail?: string
  password: string
  passwordConfirm: string
  name: string
  phone: string
  agreedTerms: boolean
  agreedPrivacy: boolean
  agreedMarketing?: boolean
}

export function validateCustomerSignUpInput(input: CustomerSignUpInput): ValidationResult {
  return (
    validateUsername(input.loginId) ??
    validateEmail(input.optionalEmail ?? '', { required: false }) ??
    validateSignupPassword(input.password) ??
    validatePasswordConfirm(input.password, input.passwordConfirm) ??
    validateName(input.name, { fieldLabel: '이름' }) ??
    validatePhone(input.phone, { fieldLabel: '전화번호' }) ??
    (input.agreedTerms ? null : '이용약관에 동의해주세요.') ??
    (input.agreedPrivacy ? null : '개인정보처리방침에 동의해주세요.')
  )
}

export function validateLoginInput(input: {
  loginId: string
  password: string
}): ValidationResult {
  if (isBlank(input.loginId)) {
    return '아이디를 입력해주세요.'
  }

  return validatePassword(input.password)
}

export function validateCheckoutForm(form: CheckoutFormData): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {}

  const customerNameError = validatePersonName(form.customerName, { fieldLabel: '주문자 이름' })
  if (customerNameError) {
    errors.customerName = customerNameError
  }

  const customerPhoneError = validatePhone(form.customerPhone, { fieldLabel: '주문자 연락처' })
  if (customerPhoneError) {
    errors.customerPhone = customerPhoneError
  }

  const emailError = validateEmail(form.customerEmail, { required: false })
  if (emailError) {
    errors.customerEmail = emailError
  }

  if (!form.sameAsOrdererForRecipient) {
    const recipientNameError = validateName(form.recipientName, { fieldLabel: '받는 분' })
    if (recipientNameError) {
      errors.recipientName = recipientNameError
    }

    const recipientPhoneError = validatePhone(form.recipientPhone, { fieldLabel: '받는 분 연락처' })
    if (recipientPhoneError) {
      errors.recipientPhone = recipientPhoneError
    }
  }

  const zipcodeError = validateZipcode(form.postalCode)
  if (zipcodeError) {
    errors.postalCode = zipcodeError
  }

  const addressError = validateAddressLine(form.address, '기본주소', 5)
  if (addressError) {
    errors.address = addressError
  }

  const addressDetailError = validateAddressDetail(form.addressDetail)
  if (addressDetailError) {
    errors.addressDetail = addressDetailError
  }

  const memoError = validateTextContent(form.memo, {
    fieldLabel: '배송메모',
    maxLength: MAX_MEMO_LENGTH,
    required: false,
  })
  if (memoError) {
    errors.memo = memoError
  }

  if (!form.sameAsOrdererForDepositor) {
    const depositorError = validateName(form.depositorName, { fieldLabel: '입금자명' })
    if (depositorError) {
      errors.depositorName = depositorError
    }
  } else if (!form.customerName.trim()) {
    errors.depositorName = '입금자명을 확인하려면 주문자 이름을 입력해주세요.'
  }

  if (!form.agreedOrder) {
    errors.agreedOrder = '주문 내용 확인에 동의해주세요.'
  }

  if (!form.agreedPrivacy) {
    errors.agreedPrivacy = '개인정보 수집·이용에 동의해주세요.'
  }

  return errors
}

export function hasCheckoutFormErrors(errors: CheckoutFormErrors): boolean {
  return hasFieldErrors(errors)
}

export type CustomerAddressField =
  | 'label'
  | 'recipientName'
  | 'phone'
  | 'zipcode'
  | 'address1'
  | 'address2'

export function validateCustomerAddressInput(
  input: CustomerAddressInput,
): FieldErrors<CustomerAddressField> {
  const errors: FieldErrors<CustomerAddressField> = {}

  const labelError = validateTextContent(input.label, {
    fieldLabel: '배송지 이름',
    maxLength: MAX_ADDRESS_LABEL_LENGTH,
  })
  if (labelError) {
    errors.label = labelError
  }

  const recipientError = validateName(input.recipientName, { fieldLabel: '수령인' })
  if (recipientError) {
    errors.recipientName = recipientError
  }

  const phoneError = validatePhone(input.phone)
  if (phoneError) {
    errors.phone = phoneError
  }

  const zipcodeError = validateZipcode(input.zipcode)
  if (zipcodeError) {
    errors.zipcode = zipcodeError
  }

  const address1Error = validateAddressLine(input.address1, '주소')
  if (address1Error) {
    errors.address1 = address1Error
  }

  const address2Error = validateAddressDetail(input.address2 ?? '')
  if (address2Error) {
    errors.address2 = address2Error
  }

  return errors
}

export function getFirstFieldError<T extends string>(errors: FieldErrors<T>): string | null {
  const firstKey = Object.keys(errors)[0] as T | undefined
  return firstKey ? errors[firstKey] ?? null : null
}

export function validateMemberProfileInput(input: {
  name: string
  phone: string
}): ValidationResult {
  return validateName(input.name, { fieldLabel: '이름' }) ?? validatePhone(input.phone, { required: false })
}

export function validatePasswordChangeInput(input: {
  newPassword: string
  confirmPassword: string
}): ValidationResult {
  return (
    validatePassword(input.newPassword) ??
    validatePasswordConfirm(input.newPassword, input.confirmPassword)
  )
}

export function validateInquiryFormInput(input: {
  customerName: string
  customerPhone: string
  customerEmail?: string
  orderReference?: string
  message: string
}): ValidationResult {
  return (
    validateName(input.customerName, { fieldLabel: '이름' }) ??
    validatePhone(input.customerPhone) ??
    validateEmail(input.customerEmail ?? '', { required: false }) ??
    validateTextContent(input.orderReference ?? '', {
      fieldLabel: '주문번호',
      maxLength: MAX_ORDER_REFERENCE_LENGTH,
      required: false,
    }) ??
    validateTextContent(input.message, {
      fieldLabel: '문의 내용',
      minLength: 5,
      maxLength: MAX_INQUIRY_MESSAGE_LENGTH,
    })
  )
}

export function validateSearchQuery(query: string): ValidationResult {
  const normalized = sanitizeSearchQuery(query)

  if (!normalized) {
    return '검색어를 입력해주세요.'
  }

  if (normalized.length > MAX_SEARCH_LENGTH) {
    return `검색어는 ${MAX_SEARCH_LENGTH}자 이하로 입력해주세요.`
  }

  return null
}

export function validateAdminNoticeInput(input: {
  title: string
  content: string
}): ValidationResult {
  return (
    validateTextContent(input.title, {
      fieldLabel: '제목',
      maxLength: MAX_NOTICE_TITLE_LENGTH,
    }) ??
    validateTextContent(input.content, {
      fieldLabel: '내용',
      minLength: 2,
      maxLength: MAX_NOTICE_CONTENT_LENGTH,
    })
  )
}

export function validateAdminBannerInput(input: {
  eyebrow: string
  headline: string
  description: string
  button_text: string
  button_link: string
}): ValidationResult {
  return (
    validateTextContent(input.eyebrow, {
      fieldLabel: '작은 제목',
      maxLength: MAX_BANNER_EYEBROW_LENGTH,
      required: false,
    }) ??
    validateTextContent(input.headline, {
      fieldLabel: '메인 제목',
      maxLength: MAX_BANNER_TITLE_LENGTH,
    }) ??
    validateTextContent(input.description, {
      fieldLabel: '설명',
      maxLength: MAX_BANNER_DESCRIPTION_LENGTH,
      required: false,
    }) ??
    validateTextContent(input.button_text, {
      fieldLabel: '버튼 텍스트',
      maxLength: MAX_BANNER_BUTTON_TEXT_LENGTH,
      required: false,
    }) ??
    validateTextContent(input.button_link, {
      fieldLabel: '링크',
      maxLength: 500,
      required: false,
    })
  )
}

export function validateAdminProductInput(input: {
  slug: string
  name: string
  price: number
  stock: number
}): ValidationResult {
  const slug = sanitizeText(input.slug, { maxLength: 120 })
  const name = sanitizeText(input.name, { maxLength: 200 })

  if (!slug) {
    return '슬러그를 입력해주세요.'
  }

  if (!name) {
    return '상품명을 입력해주세요.'
  }

  return validatePrice(input.price) ?? validateNonNegativeInteger(input.stock, '재고')
}

export function validateAdminReplyMessage(message: string): ValidationResult {
  return validateTextContent(message, {
    fieldLabel: '답변',
    minLength: 1,
    maxLength: MAX_ADMIN_REPLY_LENGTH,
  })
}

export function sanitizeCheckoutForm(form: CheckoutFormData): CheckoutFormData {
  return {
    customerName: sanitizeText(form.customerName, { maxLength: MAX_NAME_LENGTH }),
    customerPhone: sanitizePhone(form.customerPhone),
    customerEmail: sanitizeEmail(form.customerEmail),
    recipientName: sanitizeText(form.recipientName, { maxLength: MAX_NAME_LENGTH }),
    recipientPhone: sanitizePhone(form.recipientPhone),
    postalCode: sanitizeZipcode(form.postalCode),
    address: sanitizeText(form.address, { maxLength: MAX_ADDRESS_LINE_LENGTH }),
    addressDetail: sanitizeText(form.addressDetail, { maxLength: MAX_ADDRESS_DETAIL_LENGTH }),
    memo: sanitizeText(form.memo, { maxLength: MAX_MEMO_LENGTH }),
    depositorName: sanitizeText(form.depositorName, { maxLength: MAX_NAME_LENGTH }),
    sameAsOrdererForDepositor: form.sameAsOrdererForDepositor,
    sameAsOrdererForRecipient: form.sameAsOrdererForRecipient,
    selectedCouponId: form.selectedCouponId,
    agreedOrder: form.agreedOrder,
    agreedPrivacy: form.agreedPrivacy,
  }
}

export function sanitizeCustomerAddressInput(input: CustomerAddressInput): CustomerAddressInput {
  return {
    label: sanitizeText(input.label, { maxLength: MAX_ADDRESS_LABEL_LENGTH }) || '집',
    recipientName: sanitizeText(input.recipientName, { maxLength: MAX_NAME_LENGTH }),
    phone: sanitizePhone(input.phone),
    zipcode: sanitizeZipcode(input.zipcode),
    address1: sanitizeText(input.address1, { maxLength: MAX_ADDRESS_LINE_LENGTH }),
    address2: sanitizeText(input.address2 ?? '', { maxLength: MAX_ADDRESS_DETAIL_LENGTH }),
    isDefault: input.isDefault ?? false,
  }
}

export function sanitizeInquiryInput(input: {
  customerName: string
  customerPhone: string
  customerEmail: string
  orderReference: string
  message: string
}) {
  return {
    customerName: sanitizeText(input.customerName, { maxLength: MAX_NAME_LENGTH }),
    customerPhone: sanitizePhone(input.customerPhone),
    customerEmail: sanitizeOptionalText(input.customerEmail, { maxLength: 254 }) ?? '',
    orderReference: sanitizeText(input.orderReference, { maxLength: MAX_ORDER_REFERENCE_LENGTH }),
    message: sanitizeText(input.message, { maxLength: MAX_INQUIRY_MESSAGE_LENGTH }),
  }
}

export function sanitizeMemberProfileInput(input: { name: string; phone: string }) {
  return {
    name: sanitizeText(input.name, { maxLength: MAX_NAME_LENGTH }),
    phone: sanitizePhone(input.phone),
  }
}

export function sanitizeAdminNoticeInput(input: { title: string; content: string }) {
  return {
    title: sanitizeText(input.title, { maxLength: MAX_NOTICE_TITLE_LENGTH }),
    content: sanitizeText(input.content, { maxLength: MAX_NOTICE_CONTENT_LENGTH }),
  }
}

export function sanitizeAdminBannerInput(input: {
  eyebrow: string
  headline: string
  description: string
  button_text: string
  button_link: string
}) {
  return {
    eyebrow: sanitizeText(input.eyebrow, { maxLength: MAX_BANNER_EYEBROW_LENGTH }),
    headline: sanitizeText(input.headline, { maxLength: MAX_BANNER_TITLE_LENGTH }),
    description: sanitizeText(input.description, { maxLength: MAX_BANNER_DESCRIPTION_LENGTH }),
    button_text: sanitizeText(input.button_text, { maxLength: MAX_BANNER_BUTTON_TEXT_LENGTH }),
    button_link: sanitizeText(input.button_link, { maxLength: 500 }),
  }
}
