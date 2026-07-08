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
import { ADMIN_UNAUTHORIZED_MESSAGE } from '../lib/adminAuthConfig'
import { type AdminAuthStatus, resolveAdminAuthStatus } from '../lib/adminAccess'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  AdminAuthError,
  signInAdmin,
  signOutAdmin,
} from '../services/adminAuthService'

interface AdminAuthContextValue {
  session: Session | null
  user: User | null
  authStatus: AdminAuthStatus
  isLoading: boolean
  isAuthenticated: boolean
  isForbidden: boolean
  unauthorizedMessage: string | null
  signIn: (loginId: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearUnauthorizedMessage: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus>('loading')
  const [unauthorizedMessage, setUnauthorizedMessage] = useState<string | null>(null)

  const clearUnauthorizedMessage = useCallback(() => {
    setUnauthorizedMessage(null)
  }, [])

  const applyResolvedAuth = useCallback(
    (status: Exclude<AdminAuthStatus, 'loading'>, nextSession: Session | null) => {
      setAuthStatus(status)
      setSession(nextSession)
      setUnauthorizedMessage(status === 'forbidden' ? ADMIN_UNAUTHORIZED_MESSAGE : null)
    },
    [],
  )

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      applyResolvedAuth('unauthenticated', null)
      return
    }

    const authClient = supabase
    let cancelled = false

    async function loadSession() {
      setAuthStatus('loading')

      try {
        const { data: sessionData, error: sessionError } = await authClient.auth.getSession()
        if (cancelled) {
          return
        }

        if (sessionError || !sessionData.session) {
          applyResolvedAuth('unauthenticated', null)
          return
        }

        const { data: userData, error: userError } = await authClient.auth.getUser()
        if (cancelled) {
          return
        }

        if (userError || !userData.user) {
          applyResolvedAuth('unauthenticated', null)
          return
        }

        const validatedSession = { ...sessionData.session, user: userData.user }
        const resolved = await resolveAdminAuthStatus(validatedSession)
        if (!cancelled) {
          applyResolvedAuth(resolved.status, resolved.session)
        }
      } catch {
        if (!cancelled) {
          applyResolvedAuth('unauthenticated', null)
        }
      }
    }

    void loadSession()

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) {
        return
      }

      void (async () => {
        setAuthStatus('loading')

        if (!nextSession) {
          if (!cancelled) {
            applyResolvedAuth('unauthenticated', null)
          }
          return
        }

        const { data: userData, error: userError } = await authClient.auth.getUser()
        if (cancelled) {
          return
        }

        const validatedSession =
          userError || !userData.user
            ? null
            : { ...nextSession, user: userData.user }

        const resolved = await resolveAdminAuthStatus(validatedSession)
        if (!cancelled) {
          applyResolvedAuth(resolved.status, resolved.session)
        }
      })()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [applyResolvedAuth])

  const signIn = useCallback(
    async (loginId: string, password: string) => {
      const nextSession = await signInAdmin(loginId, password)
      applyResolvedAuth('authenticated', nextSession)
    },
    [applyResolvedAuth],
  )

  const signOut = useCallback(async () => {
    await signOutAdmin()
    applyResolvedAuth('unauthenticated', null)
  }, [applyResolvedAuth])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      authStatus,
      isLoading: authStatus === 'loading',
      isAuthenticated: authStatus === 'authenticated',
      isForbidden: authStatus === 'forbidden',
      unauthorizedMessage,
      signIn,
      signOut,
      clearUnauthorizedMessage,
    }),
    [session, authStatus, unauthorizedMessage, signIn, signOut, clearUnauthorizedMessage],
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
