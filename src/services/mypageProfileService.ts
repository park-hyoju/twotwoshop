import { logSupabaseError } from '../utils/errorLog'
import {
  sanitizeMemberProfileInput,
  validateMemberProfileInput,
  validatePasswordChangeInput,
} from '../utils/validators'
import { fetchCurrentUserProfile } from './userProfileRepository'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { UserProfile } from '../types/userProfile'

export class MypageProfileServiceError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'MypageProfileServiceError'
    this.cause = cause
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new MypageProfileServiceError('프로필을 수정할 수 없습니다.')
  }
}

export async function updateMemberProfile(input: {
  name: string
  phone: string
}): Promise<UserProfile | null> {
  assertSupabaseReady()

  const sanitized = sanitizeMemberProfileInput(input)
  const validationError = validateMemberProfileInput(sanitized)

  if (validationError) {
    throw new MypageProfileServiceError(validationError)
  }

  const { data: userData, error: userError } = await supabase!.auth.getUser()

  if (userError || !userData.user) {
    throw new MypageProfileServiceError('로그인이 필요합니다.', userError)
  }

  const { data, error } = await supabase!
    .from('user_profiles')
    .update({
      name: sanitized.name,
      phone: sanitized.phone || null,
    })
    .eq('id', userData.user.id)
    .select('id, name, phone, email, created_at, updated_at')
    .maybeSingle()

  if (error) {
    logSupabaseError('mypageProfileService.updateMemberProfile', error)
    throw new MypageProfileServiceError('회원정보 수정에 실패했습니다.', error)
  }

  if (data) {
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  const { data: inserted, error: insertError } = await supabase!
    .from('user_profiles')
    .insert({
      id: userData.user.id,
      name: sanitized.name,
      phone: sanitized.phone || null,
      email: userData.user.email ?? null,
    })
    .select('id, name, phone, email, created_at, updated_at')
    .single()

  if (insertError) {
    logSupabaseError('mypageProfileService.updateMemberProfile.insert', insertError)
    throw new MypageProfileServiceError('회원정보 저장에 실패했습니다.', insertError)
  }

  return {
    id: inserted.id,
    name: inserted.name,
    phone: inserted.phone,
    email: inserted.email,
    createdAt: inserted.created_at,
    updatedAt: inserted.updated_at,
  }
}

export async function updateMemberPassword(input: {
  newPassword: string
  confirmPassword: string
}): Promise<void> {
  assertSupabaseReady()

  const validationError = validatePasswordChangeInput(input)

  if (validationError) {
    throw new MypageProfileServiceError(validationError)
  }

  const { error } = await supabase!.auth.updateUser({ password: input.newPassword })

  if (error) {
    logSupabaseError('mypageProfileService.updateMemberPassword', error)
    throw new MypageProfileServiceError('비밀번호 변경에 실패했습니다.', error)
  }
}

export async function loadMemberProfileForEdit(userId: string): Promise<UserProfile | null> {
  return fetchCurrentUserProfile(userId)
}
