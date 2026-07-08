import type { Session, User } from '@supabase/supabase-js'
import { ADMIN_ROLE, isAdminUser } from './adminAuthConfig'
import { isSupabaseConfigured, supabase } from './supabase'

export type AdminAuthStatus = 'loading' | 'unauthenticated' | 'forbidden' | 'authenticated'

interface UserProfileRoleRow {
  role: string | null
}

export async function hasAdminRoleInProfile(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle<UserProfileRoleRow>()

  if (error) {
    if (import.meta.env.DEV) {
      console.warn('[adminAccess] user_profiles.role lookup failed:', error.message)
    }
    return false
  }

  return data?.role === ADMIN_ROLE
}

export async function verifyAdminUser(
  user: Pick<User, 'id' | 'app_metadata' | 'email'> | null | undefined,
): Promise<boolean> {
  if (!user) {
    return false
  }

  if (isAdminUser(user)) {
    return true
  }

  return hasAdminRoleInProfile(user.id)
}

export async function resolveAdminAuthStatus(session: Session | null): Promise<{
  status: Exclude<AdminAuthStatus, 'loading'>
  session: Session | null
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { status: 'unauthenticated', session: null }
  }

  if (!session?.user) {
    return { status: 'unauthenticated', session: null }
  }

  const isAdmin = await verifyAdminUser(session.user)
  if (isAdmin) {
    return { status: 'authenticated', session }
  }

  return { status: 'forbidden', session: null }
}
