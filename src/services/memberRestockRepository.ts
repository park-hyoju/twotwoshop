import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { MemberRestockNotification } from '../types/mypage'

export class MemberRestockRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'MemberRestockRepositoryError'
    this.cause = cause
  }
}

function parseRestockRow(item: unknown): MemberRestockNotification | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const row = item as Record<string, unknown>

  if (
    typeof row.id !== 'string' ||
    typeof row.product_id !== 'string' ||
    typeof row.product_name !== 'string' ||
    typeof row.created_at !== 'string' ||
    typeof row.is_notified !== 'boolean'
  ) {
    return null
  }

  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: typeof row.product_slug === 'string' ? row.product_slug : null,
    isNotified: row.is_notified,
    createdAt: row.created_at,
    notifiedAt: typeof row.notified_at === 'string' ? row.notified_at : null,
  }
}

export async function fetchMemberRestockNotifications(): Promise<MemberRestockNotification[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new MemberRestockRepositoryError('재입고 알림을 불러올 수 없습니다.')
  }

  const { data, error } = await supabase.rpc('get_member_restock_notifications')

  if (error) {
    throw new MemberRestockRepositoryError('재입고 알림을 불러오지 못했습니다.', error)
  }

  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map(parseRestockRow)
    .filter((item): item is MemberRestockNotification => item !== null)
}
