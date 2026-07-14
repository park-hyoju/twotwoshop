import { describe, expect, it } from 'vitest'
import {
  sanitizeUsernameInput,
  validateCustomerSignUpInput,
  validateSignupPassword,
  validateUsername,
} from './customerAuthValidation'

const validSignupInput = {
  loginId: 'user01',
  password: 'password123',
  passwordConfirm: 'password123',
  name: '홍길동',
  phone: '01012345678',
  agreedTerms: true,
  agreedPrivacy: true,
}

describe('customerAuthValidation', () => {
  it('sanitizes username input to lowercase alphanumeric', () => {
    expect(sanitizeUsernameInput('JuJu-123!')).toBe('juju123')
  })

  it('validates username rules', () => {
    expect(validateUsername('abc')).toContain('4~20')
    expect(validateUsername('한글아이디')).toContain('영문')
    expect(validateUsername('user_01')).toContain('영문')
    expect(validateUsername('user01')).toBeNull()
  })

  it('validates signup password rules', () => {
    expect(validateSignupPassword('short1')).toContain('8자')
    expect(validateSignupPassword('passwordonly')).toContain('영문과 숫자')
    expect(validateSignupPassword('12345678')).toContain('영문과 숫자')
    expect(validateSignupPassword('password123')).toBeNull()
  })

  it('validates signup input', () => {
    expect(validateCustomerSignUpInput(validSignupInput)).toBeNull()

    expect(
      validateCustomerSignUpInput({
        ...validSignupInput,
        loginId: 'ab',
      }),
    ).toMatch(/4~20/)

    expect(
      validateCustomerSignUpInput({
        ...validSignupInput,
        password: 'short',
        passwordConfirm: 'short',
      }),
    ).toMatch(/8자/)

    expect(
      validateCustomerSignUpInput({
        ...validSignupInput,
        passwordConfirm: 'different',
      }),
    ).toMatch(/일치/)

    expect(
      validateCustomerSignUpInput({
        ...validSignupInput,
        phone: '123',
      }),
    ).toMatch(/10~11/)

    expect(
      validateCustomerSignUpInput({
        ...validSignupInput,
        agreedTerms: false,
      }),
    ).toMatch(/이용약관/)

    expect(
      validateCustomerSignUpInput({
        ...validSignupInput,
        agreedPrivacy: false,
      }),
    ).toMatch(/개인정보/)
  })
})
