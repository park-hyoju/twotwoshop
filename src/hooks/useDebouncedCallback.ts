import { useEffect, useRef } from 'react'

export interface DebouncedCallback<T extends (...args: never[]) => void> {
  (...args: Parameters<T>): void
  cancel: () => void
}

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs: number,
): DebouncedCallback<T> {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  function cancel() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function debounced(...args: Parameters<T>) {
    cancel()

    timeoutRef.current = window.setTimeout(() => {
      callbackRef.current(...args)
    }, delayMs)
  }

  return Object.assign(debounced, { cancel }) as DebouncedCallback<T>
}
