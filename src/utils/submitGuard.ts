export function createSubmitGuard() {
  let locked = false

  return {
    get isLocked() {
      return locked
    },
    async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
      if (locked) {
        return undefined
      }

      locked = true
      try {
        return await fn()
      } finally {
        locked = false
      }
    },
  }
}

export async function runGuardedSubmit<T>(
  isSubmitting: boolean,
  setIsSubmitting: (value: boolean) => void,
  fn: () => Promise<T>,
): Promise<T | undefined> {
  if (isSubmitting) {
    return undefined
  }

  setIsSubmitting(true)
  try {
    return await fn()
  } finally {
    setIsSubmitting(false)
  }
}
