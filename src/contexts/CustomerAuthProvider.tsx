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
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  CustomerAuthError,
  getCustomerDisplayName,
  getCustomerUsername,
  signInCustomer,
  signOutCustomer,
  signUpCustomer,
  syncCustomerProfileIfMissing,
  type CustomerSignUpResult,
} from '../services/customerAuthService'
import { fetchCurrentUserProfile, isStorefrontMember } from '../services/userProfileRepository'
import type { CustomerSignUpInput } from '../lib/customerAuthValidation'
import type { UserProfile } from '../types/userProfile'

interface CustomerAuthContextValue {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  username: string | null
  displayName: string | null
  isLoading: boolean
  isMember: boolean
  refreshProfile: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: CustomerSignUpInput) => Promise<CustomerSignUpResult>
  signOut: () => Promise<void>
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null)

function isCustomerSession(session: Session | null): session is Session {
  if (!session?.user?.email) {
    return false
  }

  return isStorefrontMember(session.user)
}

async function loadProfileForSession(session: Session): Promise<UserProfile | null> {
  const existing = await fetchCurrentUserProfile(session.user.id)
  if (existing) {
    return existing
  }

  return syncCustomerProfileIfMissing(session)
}

export function getCustomerAuthErrorMessage(error: unknown): string {
  if (error instanceof CustomerAuthError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  const refreshProfile = useCallback(async () => {
    if (!session || !isCustomerSession(session)) {
      setProfile(null)
      return
    }

    const nextProfile = await loadProfileForSession(session)
    setProfile(nextProfile)
  }, [session])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function loadSession() {
      const { data, error } = await supabase!.auth.getSession()

      if (cancelled) {
        return
      }

      if (error) {
        setSession(null)
        setProfile(null)
        setIsLoading(false)
        return
      }

      const nextSession = isCustomerSession(data.session) ? data.session : null
      setSession(nextSession)

      if (nextSession) {
        const nextProfile = await loadProfileForSession(nextSession)
        if (!cancelled) {
          setProfile(nextProfile)
        }
      } else {
        setProfile(null)
      }

      if (!cancelled) {
        setIsLoading(false)
      }
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) {
        return
      }

      const customerSession = isCustomerSession(nextSession) ? nextSession : null
      setSession(customerSession)

      if (customerSession) {
        void loadProfileForSession(customerSession).then((nextProfile) => {
          if (!cancelled) {
            setProfile(nextProfile)
          }
        })
      } else {
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const nextSession = await signInCustomer(email, password)
    setSession(nextSession)

    const nextProfile = await loadProfileForSession(nextSession)
    setProfile(nextProfile)
  }, [])

  const signUp = useCallback(async (input: CustomerSignUpInput) => {
    return signUpCustomer(input)
  }, [])

  const signOut = useCallback(async () => {
    await signOutCustomer()
    setSession(null)
    setProfile(null)
  }, [])

  const username = useMemo(() => getCustomerUsername(session), [session])
  const displayName = useMemo(
    () => getCustomerDisplayName(session) ?? profile?.name ?? null,
    [profile?.name, session],
  )

  const value = useMemo<CustomerAuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      username,
      displayName,
      isLoading,
      isMember: Boolean(session?.user),
      refreshProfile,
      signIn,
      signUp,
      signOut,
    }),
    [displayName, isLoading, profile, refreshProfile, session, signIn, signOut, signUp, username],
  )

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const context = useContext(CustomerAuthContext)

  if (!context) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider')
  }

  return context
}

export function useOptionalCustomerAuth(): CustomerAuthContextValue | null {
  return useContext(CustomerAuthContext)
}
