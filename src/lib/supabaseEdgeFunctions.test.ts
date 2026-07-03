import { describe, expect, it } from 'vitest'
import {
  EDGE_FUNCTION_CUSTOMER_SIGNUP,
  EDGE_FUNCTION_PHONE_PASSWORD_RESET_COMPLETE,
  EDGE_FUNCTION_PHONE_PASSWORD_RESET_SEND,
  EDGE_FUNCTION_PHONE_PASSWORD_RESET_VERIFY,
} from './supabaseEdgeFunctions'

describe('supabaseEdgeFunctions', () => {
  it('uses deploy folder names as function slugs', () => {
    expect(EDGE_FUNCTION_PHONE_PASSWORD_RESET_SEND).toBe('phone-password-reset-send')
    expect(EDGE_FUNCTION_PHONE_PASSWORD_RESET_VERIFY).toBe('phone-password-reset-verify')
    expect(EDGE_FUNCTION_PHONE_PASSWORD_RESET_COMPLETE).toBe('phone-password-reset-complete')
    expect(EDGE_FUNCTION_CUSTOMER_SIGNUP).toBe('customer-signup')
  })
})
