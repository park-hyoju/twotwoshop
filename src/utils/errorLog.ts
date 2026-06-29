interface SupabaseErrorLike {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export function logSupabaseError(scope: string, error: unknown): void {
  if (error && typeof error === 'object') {
    const postgrestError = error as SupabaseErrorLike
    console.error(`[${scope}]`, {
      code: postgrestError.code,
      message: postgrestError.message,
      details: postgrestError.details,
      hint: postgrestError.hint,
    })
    return
  }

  console.error(`[${scope}]`, error)
}
