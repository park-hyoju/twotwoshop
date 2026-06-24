import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type {
  AdminInquiriesQueryParams,
  AdminInquiriesQueryResult,
  AdminInquiryRow,
  AdminInquirySummaryStats,
  AdminInquiryUpdateInput,
  DbInquiryStatus,
} from '../types/adminInquiry'

const INQUIRY_SELECT = `
  id,
  inquiry_number,
  customer_name,
  customer_phone,
  customer_email,
  inquiry_type,
  status,
  message,
  admin_reply,
  admin_note,
  created_at,
  updated_at
`

function getTodayBoundaries() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  return {
    todayStart: todayStart.toISOString(),
    tomorrowStart: tomorrowStart.toISOString(),
  }
}

export class AdminInquiryRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminInquiryRepositoryError'
    this.cause = cause
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new AdminInquiryRepositoryError(
      '문의 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    )
  }
}

async function fetchInquiryCount(options?: {
  status?: DbInquiryStatus
  from?: string
  to?: string
}): Promise<number> {
  let query = supabase!.from('inquiries').select('*', { count: 'exact', head: true })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.from) {
    query = query.gte('created_at', options.from)
  }

  if (options?.to) {
    query = query.lt('created_at', options.to)
  }

  const { count, error } = await query

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function fetchAdminInquirySummary(): Promise<AdminInquirySummaryStats> {
  assertSupabaseReady()

  const { todayStart, tomorrowStart } = getTodayBoundaries()

  const [totalCount, pendingCount, todayCount] = await Promise.all([
    fetchInquiryCount(),
    fetchInquiryCount({ status: 'pending' }),
    fetchInquiryCount({ from: todayStart, to: tomorrowStart }),
  ])

  return {
    totalCount,
    pendingCount,
    todayCount,
  }
}

export async function fetchAdminInquiries(
  params: AdminInquiriesQueryParams,
): Promise<AdminInquiriesQueryResult> {
  assertSupabaseReady()

  const { page, pageSize, filters } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const queryText = filters.query.trim()

  let query = supabase!
    .from('inquiries')
    .select(INQUIRY_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (queryText) {
    const pattern = `%${queryText}%`
    query = query.or(
      [
        `customer_name.ilike.${pattern}`,
        `customer_phone.ilike.${pattern}`,
        `customer_email.ilike.${pattern}`,
        `message.ilike.${pattern}`,
        `inquiry_number.ilike.${pattern}`,
      ].join(','),
    )
  }

  if (filters.inquiryType !== 'all') {
    query = query.eq('inquiry_type', filters.inquiryType)
  }

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new AdminInquiryRepositoryError('문의 목록을 불러오지 못했습니다.', error)
  }

  return {
    inquiries: (data ?? []) as AdminInquiryRow[],
    totalCount: count ?? 0,
  }
}

export async function fetchAdminInquiryById(id: string): Promise<AdminInquiryRow | null> {
  assertSupabaseReady()

  const { data, error } = await supabase!
    .from('inquiries')
    .select(INQUIRY_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new AdminInquiryRepositoryError('문의 상세를 불러오지 못했습니다.', error)
  }

  return (data as AdminInquiryRow | null) ?? null
}

export async function updateAdminInquiry(input: AdminInquiryUpdateInput): Promise<void> {
  assertSupabaseReady()

  const { error } = await supabase!
    .from('inquiries')
    .update({
      status: input.status,
      admin_reply: input.adminReply.trim() || null,
      admin_note: input.adminNote.trim() || null,
    })
    .eq('id', input.id)

  if (error) {
    throw new AdminInquiryRepositoryError('문의 정보를 저장하지 못했습니다.', error)
  }
}

export async function fetchUnansweredInquiryCount(): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  try {
    const pendingCount = await fetchInquiryCount({ status: 'pending' })
    const inProgressCount = await fetchInquiryCount({ status: 'in_progress' })
    return pendingCount + inProgressCount
  } catch {
    return null
  }
}
