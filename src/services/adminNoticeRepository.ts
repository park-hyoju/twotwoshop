import { assertSupabaseMutationRow } from '../lib/adminSupabaseMutation'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AdminNoticeFormInput, NoticeRow } from '../types/notice'
import { sanitizeAdminNoticeInput, validateAdminNoticeInput } from '../utils/validators'

export class AdminNoticeRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminNoticeRepositoryError'
    this.cause = cause
  }
}

const NOTICE_SELECT = `
  id,
  title,
  content,
  is_pinned,
  is_active,
  created_at,
  updated_at
`

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new AdminNoticeRepositoryError(
      'Supabase 환경변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.',
    )
  }
}

function buildPayload(input: AdminNoticeFormInput) {
  const sanitized = sanitizeAdminNoticeInput(input)

  return {
    title: sanitized.title,
    content: sanitized.content,
    is_pinned: input.is_pinned,
    is_active: input.is_active,
  }
}

function assertValidNoticeInput(input: AdminNoticeFormInput): void {
  const validationError = validateAdminNoticeInput(sanitizeAdminNoticeInput(input))

  if (validationError) {
    throw new AdminNoticeRepositoryError(validationError)
  }
}

export async function fetchAdminNotices(): Promise<NoticeRow[]> {
  assertSupabaseReady()

  const { data, error } = await supabase!
    .from('notices')
    .select(NOTICE_SELECT)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new AdminNoticeRepositoryError('공지사항 목록을 불러오지 못했습니다.', error)
  }

  return data as NoticeRow[]
}

export async function createAdminNotice(input: AdminNoticeFormInput): Promise<NoticeRow> {
  assertSupabaseReady()
  assertValidNoticeInput(input)

  const { data, error } = await supabase!
    .from('notices')
    .insert(buildPayload(input))
    .select(NOTICE_SELECT)
    .single()

  return assertSupabaseMutationRow(
    data,
    error,
    '공지사항을 등록하지 못했습니다.',
    AdminNoticeRepositoryError,
  ) as NoticeRow
}

export async function updateAdminNotice(
  noticeId: string,
  input: AdminNoticeFormInput,
): Promise<NoticeRow> {
  assertSupabaseReady()
  assertValidNoticeInput(input)

  const { data, error } = await supabase!
    .from('notices')
    .update(buildPayload(input))
    .eq('id', noticeId)
    .select(NOTICE_SELECT)
    .single()

  return assertSupabaseMutationRow(
    data,
    error,
    '공지사항을 수정하지 못했습니다.',
    AdminNoticeRepositoryError,
  ) as NoticeRow
}

export async function deleteAdminNotice(noticeId: string): Promise<void> {
  assertSupabaseReady()

  const { error } = await supabase!.from('notices').delete().eq('id', noticeId)

  if (error) {
    throw new AdminNoticeRepositoryError('공지사항을 삭제하지 못했습니다.', error)
  }
}

export async function setAdminNoticeActive(
  noticeId: string,
  isActive: boolean,
): Promise<NoticeRow> {
  assertSupabaseReady()

  const { data, error } = await supabase!
    .from('notices')
    .update({ is_active: isActive })
    .eq('id', noticeId)
    .select(NOTICE_SELECT)
    .single()

  return assertSupabaseMutationRow(
    data,
    error,
    '공지사항 노출 상태를 변경하지 못했습니다.',
    AdminNoticeRepositoryError,
  ) as NoticeRow
}

export async function setAdminNoticePinned(
  noticeId: string,
  isPinned: boolean,
): Promise<NoticeRow> {
  assertSupabaseReady()

  const { data, error } = await supabase!
    .from('notices')
    .update({ is_pinned: isPinned })
    .eq('id', noticeId)
    .select(NOTICE_SELECT)
    .single()

  return assertSupabaseMutationRow(
    data,
    error,
    '공지사항 고정 상태를 변경하지 못했습니다.',
    AdminNoticeRepositoryError,
  ) as NoticeRow
}
