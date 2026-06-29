import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { ADMIN_UNAUTHORIZED_MESSAGE, isAdminUser } from '../lib/adminAuthConfig'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  AdminAuthError,
  getAdminSession,
  resolveAdminSessionState,
  signInAdmin,
  signOutAdmin,
} from '../services/adminAuthService'

interface AdminAuthContextValue {
  session: Session | null
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  unauthorizedMessage: string | null
  signIn: (loginId: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearUnauthorizedMessage: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [unauthorizedMessage, setUnauthorizedMessage] = useState<string | null>(null)

  const clearUnauthorizedMessage = useCallback(() => {
    setUnauthorizedMessage(null)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function loadSession() {
      try {
        const { session: currentSession, unauthorized } = await getAdminSession()
        if (!cancelled) {
          setSession(currentSession)
          setUnauthorizedMessage(unauthorized ? ADMIN_UNAUTHORIZED_MESSAGE : null)
        }
      } catch {
        if (!cancelled) {
          setSession(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) {
        return
      }

      void (async () => {
        const { session: validatedSession, unauthorized } =
          resolveAdminSessionState(nextSession)

        if (!cancelled) {
          setSession(validatedSession)
          setUnauthorizedMessage(unauthorized ? ADMIN_UNAUTHORIZED_MESSAGE : null)
          setIsLoading(false)
        }
      })()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (loginId: string, password: string) => {
    const nextSession = await signInAdmin(loginId, password)
    setSession(nextSession)
    setUnauthorizedMessage(null)
  }, [])

  const signOut = useCallback(async () => {
    await signOutAdmin()
    setSession(null)
    setUnauthorizedMessage(null)
  }, [])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isAuthenticated: Boolean(session && isAdminUser(session.user)),
      unauthorizedMessage,
      signIn,
      signOut,
      clearUnauthorizedMessage,
    }),
    [session, isLoading, unauthorizedMessage, signIn, signOut, clearUnauthorizedMessage],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext)

  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }

  return context
}

export function getAdminAuthErrorMessage(error: unknown): string {
  if (error instanceof AdminAuthError) {
    return error.message
  }

  return '로그인 처리 중 오류가 발생했습니다.'
}
