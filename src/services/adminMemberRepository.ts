import { assertAdminRepositoryAccess } from '../lib/adminRepositoryGuard'
import { supabase } from '../lib/supabase'
import type { AdminMemberRow } from '../types/adminMember'

export class AdminMemberRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminMemberRepositoryError'
    this.cause = cause
  }
}

interface AdminListMembersRpcRow {
  id: string
  login_id: string | null
  name: string | null
  phone: string | null
  optional_email: string | null
  created_at: string
  has_order: boolean
}

function mapRow(row: AdminListMembersRpcRow): AdminMemberRow {
  return {
    id: row.id,
    loginId: row.login_id,
    name: row.name,
    phone: row.phone,
    optionalEmail: row.optional_email,
    createdAt: row.created_at,
    hasOrder: Boolean(row.has_order),
  }
}

export async function fetchAdminMembers(): Promise<AdminMemberRow[]> {
  await assertAdminRepositoryAccess(AdminMemberRepositoryError)

  const { data, error } = await supabase!.rpc('admin_list_members')

  if (error) {
    throw new AdminMemberRepositoryError('회원 목록을 불러오지 못했습니다.', error)
  }

  return ((data ?? []) as AdminListMembersRpcRow[]).map(mapRow)
}

export async function deleteAdminMember(memberId: string): Promise<string> {
  await assertAdminRepositoryAccess(AdminMemberRepositoryError)

  const trimmedId = memberId.trim()
  if (!trimmedId) {
    throw new AdminMemberRepositoryError('회원 정보가 올바르지 않습니다.')
  }

  const { data, error } = await supabase!.functions.invoke('admin-delete-member', {
    body: { memberId: trimmedId },
  })

  if (error) {
    let message = '회원 삭제에 실패했습니다.'
    const context = (error as { context?: Response }).context

    if (context) {
      try {
        const payload = (await context.json()) as { message?: string }
        if (typeof payload.message === 'string' && payload.message.trim()) {
          message = payload.message
        }
      } catch {
        // keep default message
      }
    }

    throw new AdminMemberRepositoryError(message, error)
  }

  const payload = data as { ok?: boolean; message?: string } | null

  if (!payload || payload.ok !== true) {
    throw new AdminMemberRepositoryError(
      typeof payload?.message === 'string' && payload.message.trim()
        ? payload.message
        : '회원 삭제에 실패했습니다.',
    )
  }

  return payload.message ?? '회원이 삭제되었습니다.'
}
