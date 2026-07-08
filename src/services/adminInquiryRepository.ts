import { sanitizeText } from '../utils/sanitize'
import { validateAdminReplyMessage } from '../utils/validators'
import {
  getInquiryDisplayCode,
  normalizeInquiryStatus,
} from '../lib/adminInquiryDisplay'
import { assertAdminRepositoryAccess } from '../lib/adminRepositoryGuard'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type {
  AdminInquiriesQueryParams,
  AdminInquiriesQueryResult,
  AdminInquiryMessageRow,
  AdminInquiryRow,
  AdminInquirySummaryStats,
  AdminInquiryMetaUpdateInput,
  AdminInquirySendMessageInput,
  AdminInquiryUpdateInput,
  DbInquiryStatus,
} from '../types/adminInquiry'

const STATUS_PRIORITY: Record<DbInquiryStatus, number> = {
  pending: 0,
  in_progress: 1,
  answered: 2,
  closed: 3,
}

function sortInquiriesByPriority(inquiries: AdminInquiryRow[]): AdminInquiryRow[] {
  return [...inquiries].sort((left, right) => {
    const priorityDiff = STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status]
    if (priorityDiff !== 0) {
      return priorityDiff
    }

    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  })
}

const CUSTOMER_INQUIRY_TABLE = 'customer_inquiries'
const MESSAGE_TABLE = 'customer_inquiry_messages'

const INQUIRY_SELECT_BASE = `
  id,
  inquiry_number,
  name,
  phone,
  email,
  type,
  status,
  message,
  admin_reply,
  admin_note,
  created_at,
  updated_at
`

const INQUIRY_SELECT_WITH_CODE = `
  ${INQUIRY_SELECT_BASE},
  inquiry_code
`

const INQUIRY_SELECT_FULL = `
  ${INQUIRY_SELECT_WITH_CODE},
  image_urls,
  order_reference
`

const INQUIRY_SELECT_FULL_WITH_READ = `
  ${INQUIRY_SELECT_FULL},
  admin_read_at,
  customer_read_at,
  admin_unread_count
`

const MESSAGE_SELECT_BASE = `
  id,
  sender,
  message,
  created_at
`

const MESSAGE_SELECT_FULL = `
  ${MESSAGE_SELECT_BASE},
  image_urls
`

interface PostgrestErrorLike {
  message?: string
  code?: string
  details?: string
  hint?: string
}

interface CustomerInquiryDbRow {
  id: string
  inquiry_code?: string | null
  inquiry_number: string
  name: string
  phone: string
  email: string | null
  type: AdminInquiryRow['inquiry_type']
  status: string
  message: string
  admin_reply: string | null
  admin_note: string | null
  image_urls?: string[] | null
  order_reference?: string | null
  admin_read_at?: string | null
  customer_read_at?: string | null
  admin_unread_count?: number | null
  created_at: string
  updated_at: string
}

function logSupabaseQueryError(intent: string, error: unknown): void {
  const postgrestError = error as PostgrestErrorLike

  console.error('[adminInquiryRepository]', intent, {
    message: postgrestError?.message,
    code: postgrestError?.code,
    details: postgrestError?.details,
    hint: postgrestError?.hint,
  })
}

function isMissingColumnError(error: unknown): boolean {
  const postgrestError = error as PostgrestErrorLike
  const code = postgrestError?.code ?? ''
  const message = (postgrestError?.message ?? '').toLowerCase()

  if (code === '42703' || code === 'PGRST204') {
    return true
  }

  return (
    message.includes('column') &&
    (message.includes('does not exist') ||
      message.includes('could not find') ||
      message.includes('unknown'))
  )
}

function parseImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function mapCustomerInquiryRow(row: CustomerInquiryDbRow): AdminInquiryRow {
  const adminUnreadCount = typeof row.admin_unread_count === 'number' ? row.admin_unread_count : 0
  const hasUnreadForAdmin =
    adminUnreadCount > 0 ||
    (row.admin_unread_count === undefined &&
      row.admin_read_at === undefined &&
      (row.status === 'pending' || row.status === 'in_progress'))

  return {
    id: row.id,
    inquiry_code: getInquiryDisplayCode(row),
    inquiry_number: row.inquiry_number,
    customer_name: row.name,
    customer_phone: row.phone,
    customer_email: row.email,
    inquiry_type: row.type,
    status: normalizeInquiryStatus(row.status),
    message: row.message,
    admin_reply: row.admin_reply,
    admin_note: row.admin_note,
    image_urls: parseImageUrls(row.image_urls),
    order_reference: row.order_reference ?? null,
    admin_read_at: row.admin_read_at ?? null,
    customer_read_at: row.customer_read_at ?? null,
    admin_unread_count: adminUnreadCount,
    has_unread_for_admin: hasUnreadForAdmin,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

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

async function ensureAdminAccess(): Promise<void> {
  await assertAdminRepositoryAccess(AdminInquiryRepositoryError)
}

async function fetchInquiryCount(options?: {
  status?: DbInquiryStatus
  from?: string
  to?: string
}): Promise<number> {
  let query = supabase!
    .from(CUSTOMER_INQUIRY_TABLE)
    .select('*', { count: 'exact', head: true })

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
    logSupabaseQueryError('fetchInquiryCount', error)
    throw error
  }

  return count ?? 0
}

interface InquiryListQueryResult {
  data: CustomerInquiryDbRow[] | null
  error: PostgrestErrorLike | null
  count: number | null
}

async function selectInquiriesWithFallback(options: {
  from: number
  to: number
  queryText: string
  inquiryType: AdminInquiriesQueryParams['filters']['inquiryType']
  status: AdminInquiriesQueryParams['filters']['status']
}): Promise<{ data: CustomerInquiryDbRow[]; count: number | null }> {
  const selectCandidates = [
    INQUIRY_SELECT_FULL_WITH_READ,
    INQUIRY_SELECT_FULL,
    INQUIRY_SELECT_WITH_CODE,
    INQUIRY_SELECT_BASE,
  ]
  let lastError: unknown = null

  for (const selectColumns of selectCandidates) {
    let query = supabase!
      .from(CUSTOMER_INQUIRY_TABLE)
      .select(selectColumns, { count: 'exact' })
      .order('updated_at', { ascending: false })

    if (options.queryText) {
      const pattern = `%${options.queryText}%`
      const searchFields = [
        `name.ilike.${pattern}`,
        `phone.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `message.ilike.${pattern}`,
        `inquiry_number.ilike.${pattern}`,
      ]

      if (selectColumns.includes('inquiry_code')) {
        searchFields.push(`inquiry_code.ilike.${pattern}`)
      }

      query = query.or(searchFields.join(','))
    }

    if (options.inquiryType !== 'all') {
      query = query.eq('type', options.inquiryType)
    }

    if (options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    const { data, error, count } = (await query.range(options.from, options.to)) as InquiryListQueryResult

    if (!error) {
      if (selectColumns !== INQUIRY_SELECT_FULL) {
        console.warn(
          '[adminInquiryRepository] customer_inquiries list loaded with fallback select:',
          selectColumns.trim().split('\n').pop()?.trim() ?? selectColumns,
        )
      }

      return {
        data: (data ?? []) as CustomerInquiryDbRow[],
        count: count ?? 0,
      }
    }

    lastError = error
    logSupabaseQueryError(`selectInquiriesWithFallback (${selectColumns.trim()})`, error)

    if (!isMissingColumnError(error)) {
      break
    }
  }

  throw lastError
}

async function selectInquiryByIdWithFallback(
  id: string,
): Promise<CustomerInquiryDbRow | null> {
  const selectCandidates = [
    INQUIRY_SELECT_FULL_WITH_READ,
    INQUIRY_SELECT_FULL,
    INQUIRY_SELECT_WITH_CODE,
    INQUIRY_SELECT_BASE,
  ]
  let lastError: unknown = null

  for (const selectColumns of selectCandidates) {
    const { data, error } = await supabase!
      .from(CUSTOMER_INQUIRY_TABLE)
      .select(selectColumns)
      .eq('id', id)
      .maybeSingle()

    if (!error) {
      if (selectColumns !== INQUIRY_SELECT_FULL) {
        console.warn(
          '[adminInquiryRepository] customer_inquiries detail loaded with fallback select:',
          selectColumns.trim().split('\n').pop()?.trim() ?? selectColumns,
        )
      }

      return data as CustomerInquiryDbRow | null
    }

    lastError = error
    logSupabaseQueryError(`selectInquiryByIdWithFallback (${selectColumns.trim()})`, error)

    if (!isMissingColumnError(error)) {
      break
    }
  }

  throw lastError
}

async function fetchMessagesByInquiryId(inquiryId: string): Promise<AdminInquiryMessageRow[]> {
  const selectCandidates = [MESSAGE_SELECT_FULL, MESSAGE_SELECT_BASE]
  let lastError: unknown = null

  for (const selectColumns of selectCandidates) {
    const { data, error } = await supabase!
      .from(MESSAGE_TABLE)
      .select(selectColumns)
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: true })

    if (!error) {
      if (selectColumns !== MESSAGE_SELECT_FULL) {
        console.warn(
          '[adminInquiryRepository] customer_inquiry_messages loaded with fallback select (no image_urls)',
        )
      }

      return (data ?? []).map((row) => {
        const messageRow = row as unknown as {
          id: string
          sender: 'customer' | 'admin'
          message: string
          created_at: string
          image_urls?: unknown
        }

        return {
          id: messageRow.id,
          sender: messageRow.sender,
          message: messageRow.message,
          created_at: messageRow.created_at,
          image_urls: parseImageUrls(messageRow.image_urls),
        }
      })
    }

    lastError = error
    logSupabaseQueryError(`fetchMessagesByInquiryId (${selectColumns.trim()})`, error)

    if (!isMissingColumnError(error)) {
      console.warn(
        '[adminInquiryRepository] Skipping message thread for inquiry',
        inquiryId,
        'due to query error.',
      )
      return []
    }
  }

  console.warn(
    '[adminInquiryRepository] Skipping message thread for inquiry',
    inquiryId,
    lastError,
  )
  return []
}

export async function fetchAdminInquirySummary(): Promise<AdminInquirySummaryStats> {
  await ensureAdminAccess()

  const { todayStart, tomorrowStart } = getTodayBoundaries()

  const [totalCount, pendingCount, answeredCount, todayCount, unreadCount] = await Promise.all([
    fetchInquiryCount(),
    fetchInquiryCount({ status: 'pending' }),
    fetchInquiryCount({ status: 'answered' }),
    fetchInquiryCount({ from: todayStart, to: tomorrowStart }),
    fetchUnreadInquiryCount(),
  ])

  return {
    totalCount,
    pendingCount,
    answeredCount,
    todayCount,
    unreadCount,
  }
}

async function fetchUnreadInquiryCount(): Promise<number> {
  try {
    const { count, error } = await supabase!
      .from(CUSTOMER_INQUIRY_TABLE)
      .select('*', { count: 'exact', head: true })
      .gt('admin_unread_count', 0)

    if (error) {
      if (isMissingColumnError(error)) {
        return fetchInquiryCount({ status: 'pending' })
      }

      throw error
    }

    return count ?? 0
  } catch (error) {
    logSupabaseQueryError('fetchUnreadInquiryCount', error)
    return fetchInquiryCount({ status: 'pending' })
  }
}

export async function markAdminInquiryAsRead(inquiryId: string): Promise<void> {
  await ensureAdminAccess()

  const { error: rpcError } = await supabase!.rpc('mark_admin_inquiry_read', {
    p_inquiry_id: inquiryId,
  })

  if (!rpcError) {
    return
  }

  logSupabaseQueryError('markAdminInquiryAsRead rpc', rpcError)

  const { error: updateError } = await supabase!
    .from(CUSTOMER_INQUIRY_TABLE)
    .update({
      admin_read_at: new Date().toISOString(),
      admin_unread_count: 0,
    })
    .eq('id', inquiryId)

  if (updateError && !isMissingColumnError(updateError)) {
    logSupabaseQueryError('markAdminInquiryAsRead update', updateError)
  }
}

export async function fetchAdminInquiries(
  params: AdminInquiriesQueryParams,
): Promise<AdminInquiriesQueryResult> {
  await ensureAdminAccess()

  const { page, pageSize, filters } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const queryText = filters.query.trim()

  try {
    const { data, count } = await selectInquiriesWithFallback({
      from,
      to,
      queryText,
      inquiryType: filters.inquiryType,
      status: filters.status,
    })

    return {
      inquiries: sortInquiriesByPriority(data.map(mapCustomerInquiryRow)),
      totalCount: count ?? 0,
    }
  } catch (error) {
    logSupabaseQueryError('fetchAdminInquiries list query', error)
    throw new AdminInquiryRepositoryError('문의 목록을 불러오지 못했습니다.', error)
  }
}

export async function fetchAdminInquiryById(id: string): Promise<AdminInquiryRow | null> {
  await ensureAdminAccess()

  try {
    const data = await selectInquiryByIdWithFallback(id)

    if (!data) {
      return null
    }

    const inquiry = mapCustomerInquiryRow(data)
    const messages = await fetchMessagesByInquiryId(inquiry.id)

    return {
      ...inquiry,
      messages,
    }
  } catch (error) {
    logSupabaseQueryError('fetchAdminInquiryById', error)
    throw new AdminInquiryRepositoryError('문의 상세를 불러오지 못했습니다.', error)
  }
}

export async function sendAdminInquiryMessage(input: AdminInquirySendMessageInput): Promise<void> {
  await ensureAdminAccess()

  const trimmedMessage = sanitizeText(input.message, { maxLength: 5000 })
  const validationError = validateAdminReplyMessage(trimmedMessage)

  if (validationError) {
    throw new AdminInquiryRepositoryError(validationError)
  }

  const { error: messageError } = await supabase!.from(MESSAGE_TABLE).insert({
    inquiry_id: input.id,
    sender: 'admin',
    message: trimmedMessage,
  })

  if (messageError) {
    logSupabaseQueryError('sendAdminInquiryMessage insert', messageError)
    throw new AdminInquiryRepositoryError('답변을 전송하지 못했습니다.', messageError)
  }

  const { error: updateError } = await supabase!
    .from(CUSTOMER_INQUIRY_TABLE)
    .update({
      status: input.status,
      admin_reply: trimmedMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (updateError) {
    logSupabaseQueryError('sendAdminInquiryMessage update inquiry', updateError)
    throw new AdminInquiryRepositoryError('문의 상태를 갱신하지 못했습니다.', updateError)
  }
}

export async function updateAdminInquiryMeta(input: AdminInquiryMetaUpdateInput): Promise<void> {
  await ensureAdminAccess()

  const trimmedNote = input.adminNote.trim()

  const { error } = await supabase!
    .from(CUSTOMER_INQUIRY_TABLE)
    .update({
      status: input.status,
      admin_note: trimmedNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (error) {
    logSupabaseQueryError('updateAdminInquiryMeta', error)
    throw new AdminInquiryRepositoryError('문의 정보를 저장하지 못했습니다.', error)
  }
}

export async function updateAdminInquiry(input: AdminInquiryUpdateInput): Promise<void> {
  await ensureAdminAccess()

  const trimmedReply = input.adminReply.trim()
  const trimmedNote = input.adminNote.trim()

  const { error } = await supabase!
    .from(CUSTOMER_INQUIRY_TABLE)
    .update({
      status: input.status,
      admin_reply: trimmedReply || null,
      admin_note: trimmedNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (error) {
    logSupabaseQueryError('updateAdminInquiry', error)
    throw new AdminInquiryRepositoryError('문의 정보를 저장하지 못했습니다.', error)
  }

  if (trimmedReply) {
    const messages = await fetchMessagesByInquiryId(input.id)
    const lastAdminMessage = [...messages].reverse().find((message) => message.sender === 'admin')

    if (!lastAdminMessage || lastAdminMessage.message !== trimmedReply) {
      const { error: messageError } = await supabase!.from(MESSAGE_TABLE).insert({
        inquiry_id: input.id,
        sender: 'admin',
        message: trimmedReply,
      })

      if (messageError) {
        logSupabaseQueryError('updateAdminInquiry insert admin message', messageError)
        throw new AdminInquiryRepositoryError('관리자 답변 메시지를 저장하지 못했습니다.', messageError)
      }
    }
  }
}

export async function deleteAdminInquiry(id: string): Promise<void> {
  await ensureAdminAccess()

  const { error } = await supabase!.from(CUSTOMER_INQUIRY_TABLE).delete().eq('id', id)

  if (error) {
    logSupabaseQueryError('deleteAdminInquiry', error)
    throw new AdminInquiryRepositoryError('문의를 삭제하지 못했습니다.', error)
  }
}

export async function deleteAdminInquiries(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return
  }

  await ensureAdminAccess()

  const { error } = await supabase!.from(CUSTOMER_INQUIRY_TABLE).delete().in('id', ids)

  if (error) {
    logSupabaseQueryError('deleteAdminInquiries', error)
    throw new AdminInquiryRepositoryError('문의를 삭제하지 못했습니다.', error)
  }
}

export async function fetchUnansweredInquiryCount(): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  try {
    const { data, error } = await supabase.rpc('get_pending_inquiry_queue_count')

    if (error) {
      throw error
    }

    const pendingCount = typeof data === 'number' ? data : 0
    const inProgressCount = await fetchInquiryCount({ status: 'in_progress' })
    return pendingCount + inProgressCount
  } catch {
    return null
  }
}
