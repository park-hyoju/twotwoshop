import type { PostgrestError } from '@supabase/supabase-js'

export const ADMIN_PRODUCTS_RLS_HINT =
  'Supabase SQL Editor에서 admin-products-rls.sql (또는 fix-product-detail-save-rls.sql)을 실행해주세요.'

export function formatPostgrestErrorMessage(
  fallbackMessage: string,
  error: PostgrestError,
): string {
  const details = [error.message, error.code ? `code: ${error.code}` : '']
    .filter(Boolean)
    .join(' — ')

  return details ? `${fallbackMessage} (${details})` : fallbackMessage
}

export function assertSupabaseMutationRow<T>(
  data: T | null,
  error: PostgrestError | null,
  fallbackMessage: string,
  ErrorClass: new (message: string, cause?: unknown) => Error,
): T {
  if (error) {
    throw new ErrorClass(formatPostgrestErrorMessage(fallbackMessage, error), error)
  }

  if (data === null) {
    throw new ErrorClass(`${fallbackMessage} ${ADMIN_PRODUCTS_RLS_HINT}`)
  }

  return data
}
