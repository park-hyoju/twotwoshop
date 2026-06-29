import { assertSupabaseMutationRow } from '../lib/adminSupabaseMutation'
import { formatDateTime } from '../lib/formatDateTime'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AdminRestockNotificationRow } from '../types/restockNotification'

export class AdminRestockNotificationRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminRestockNotificationRepositoryError'
    this.cause = cause
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new AdminRestockNotificationRepositoryError(
      'Supabase 환경변수가 설정되지 않았습니다.',
    )
  }
}

interface RestockNotificationQueryRow {
  id: string
  product_id: string
  user_id: string | null
  customer_name: string | null
  phone: string | null
  email: string | null
  is_notified: boolean
  created_at: string
  notified_at: string | null
  products: { name: string; slug: string } | { name: string; slug: string }[] | null
}

function mapRow(row: RestockNotificationQueryRow): AdminRestockNotificationRow {
  const product = Array.isArray(row.products) ? row.products[0] : row.products

  return {
    id: row.id,
    product_id: row.product_id,
    product_name: product?.name ?? '-',
    product_slug: product?.slug ?? '',
    user_id: row.user_id,
    customer_name: row.customer_name,
    phone: row.phone,
    email: row.email,
    is_notified: row.is_notified,
    created_at: row.created_at,
    notified_at: row.notified_at,
  }
}

export async function fetchAdminRestockNotifications(): Promise<AdminRestockNotificationRow[]> {
  assertSupabaseReady()

  const { data, error } = await supabase!
    .from('restock_notifications')
    .select(
      `
      id,
      product_id,
      user_id,
      customer_name,
      phone,
      email,
      is_notified,
      created_at,
      notified_at,
      products ( name, slug )
    `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new AdminRestockNotificationRepositoryError(
      '재입고 알림 목록을 불러오지 못했습니다. restock-notifications.sql 적용 여부를 확인해주세요.',
      error,
    )
  }

  return ((data ?? []) as RestockNotificationQueryRow[]).map(mapRow)
}

export async function markRestockNotificationSent(notificationId: string): Promise<void> {
  assertSupabaseReady()

  const { data, error } = await supabase!
    .from('restock_notifications')
    .update({
      is_notified: true,
      notified_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .select('id')
    .maybeSingle()

  assertSupabaseMutationRow(
    data,
    error,
    '알림 발송 완료 처리에 실패했습니다.',
    AdminRestockNotificationRepositoryError,
  )
}

export function formatAdminRestockCreatedAt(value: string): string {
  return formatDateTime(value)
}
