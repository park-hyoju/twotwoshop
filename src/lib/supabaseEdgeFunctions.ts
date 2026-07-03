/**
 * Supabase Edge Function slugs — must match `supabase/functions/<name>/` folder names
 * and `supabase functions deploy <name>` targets exactly.
 */
export const EDGE_FUNCTION_PHONE_PASSWORD_RESET_SEND = 'phone-password-reset-send'
export const EDGE_FUNCTION_PHONE_PASSWORD_RESET_VERIFY = 'phone-password-reset-verify'
export const EDGE_FUNCTION_PHONE_PASSWORD_RESET_COMPLETE = 'phone-password-reset-complete'
export const EDGE_FUNCTION_CUSTOMER_SIGNUP = 'customer-signup'

export const SUPABASE_EDGE_FUNCTION_NAMES = [
  EDGE_FUNCTION_PHONE_PASSWORD_RESET_SEND,
  EDGE_FUNCTION_PHONE_PASSWORD_RESET_VERIFY,
  EDGE_FUNCTION_PHONE_PASSWORD_RESET_COMPLETE,
  EDGE_FUNCTION_CUSTOMER_SIGNUP,
] as const
