import { isDbInquiryType, normalizeInquiryStatus } from '../lib/adminInquiryDisplay'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { MemberInquirySummary } from '../types/mypage'

export class MemberInquiryRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'MemberInquiryRepositoryError'
    this.cause = cause
  }
}

function parseMemberInquiryRow(item: unknown): MemberInquirySummary | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const row = item as Record<string, unknown>

  if (
    typeof row.id !== 'string' ||
    typeof row.message !== 'string' ||
    typeof row.created_at !== 'string' ||
    typeof row.updated_at !== 'string' ||
    !isDbInquiryType(String(row.type))
  ) {
    return null
  }

  const status = normalizeInquiryStatus(String(row.status))

  return {
    id: row.id,
    inquiryCode: typeof row.inquiry_code === 'string' ? row.inquiry_code : null,
    type: row.type as MemberInquirySummary['type'],
    status,
    message: row.message,
    adminReply: typeof row.admin_reply === 'string' ? row.admin_reply : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerReadAt: typeof row.customer_read_at === 'string' ? row.customer_read_at : null,
    hasUnreadReply: row.has_unread_reply === true,
  }
}

export async function fetchMemberInquiries(): Promise<MemberInquirySummary[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new MemberInquiryRepositoryError('문의 내역을 불러올 수 없습니다.')
  }

  const { data, error } = await supabase.rpc('get_member_inquiries')

  if (error) {
    throw new MemberInquiryRepositoryError('문의 내역을 불러오지 못했습니다.', error)
  }

  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map(parseMemberInquiryRow)
    .filter((item): item is MemberInquirySummary => item !== null)
}
