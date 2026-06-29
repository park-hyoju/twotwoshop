import { assertSupabaseMutationRow } from '../lib/adminSupabaseMutation'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AdminBannerFormInput, BannerRow } from '../types/banner'
import { sanitizeAdminBannerInput, validateAdminBannerInput } from '../utils/validators'

export class AdminBannerRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminBannerRepositoryError'
    this.cause = cause
  }
}

const BANNER_SELECT = `
  id,
  title,
  description,
  button_text,
  button_link,
  desktop_image,
  mobile_image,
  sort_order,
  is_active,
  created_at,
  updated_at
`

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new AdminBannerRepositoryError(
      'Supabase 환경변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.',
    )
  }
}

function mapRow(row: BannerRow): BannerRow {
  return row
}

function buildPayload(input: AdminBannerFormInput) {
  const sanitized = sanitizeAdminBannerInput(input)

  return {
    title: sanitized.title,
    description: sanitized.description,
    button_text: sanitized.button_text,
    button_link: sanitized.button_link || '/products',
    desktop_image: input.desktop_image.trim() || null,
    mobile_image: input.mobile_image.trim() || null,
    is_active: input.is_active,
  }
}

function assertValidBannerInput(input: AdminBannerFormInput): void {
  const validationError = validateAdminBannerInput(sanitizeAdminBannerInput(input))

  if (validationError) {
    throw new AdminBannerRepositoryError(validationError)
  }
}

export async function fetchAdminBanners(): Promise<BannerRow[]> {
  assertSupabaseReady()

  const { data, error } = await supabase!
    .from('banners')
    .select(BANNER_SELECT)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new AdminBannerRepositoryError('배너 목록을 불러오지 못했습니다.', error)
  }

  return (data as BannerRow[]).map(mapRow)
}

export async function createAdminBanner(
  input: AdminBannerFormInput,
  sortOrder: number,
): Promise<BannerRow> {
  assertSupabaseReady()
  assertValidBannerInput(input)

  const { data, error } = await supabase!
    .from('banners')
    .insert({
      ...buildPayload(input),
      sort_order: sortOrder,
    })
    .select(BANNER_SELECT)
    .single()

  return assertSupabaseMutationRow(
    data,
    error,
    '배너를 등록하지 못했습니다.',
    AdminBannerRepositoryError,
  ) as BannerRow
}

export async function updateAdminBanner(
  bannerId: string,
  input: AdminBannerFormInput,
): Promise<BannerRow> {
  assertSupabaseReady()
  assertValidBannerInput(input)

  const { data, error } = await supabase!
    .from('banners')
    .update(buildPayload(input))
    .eq('id', bannerId)
    .select(BANNER_SELECT)
    .single()

  return assertSupabaseMutationRow(
    data,
    error,
    '배너를 수정하지 못했습니다.',
    AdminBannerRepositoryError,
  ) as BannerRow
}

export async function deleteAdminBanner(bannerId: string): Promise<void> {
  assertSupabaseReady()

  const { error } = await supabase!.from('banners').delete().eq('id', bannerId)

  if (error) {
    throw new AdminBannerRepositoryError('배너를 삭제하지 못했습니다.', error)
  }
}

export async function setAdminBannerActive(
  bannerId: string,
  isActive: boolean,
): Promise<BannerRow> {
  assertSupabaseReady()

  const { data, error } = await supabase!
    .from('banners')
    .update({ is_active: isActive })
    .eq('id', bannerId)
    .select(BANNER_SELECT)
    .single()

  return assertSupabaseMutationRow(
    data,
    error,
    '배너 활성화 상태를 변경하지 못했습니다.',
    AdminBannerRepositoryError,
  ) as BannerRow
}

export async function updateAdminBannerSortOrders(
  orderedIds: string[],
): Promise<void> {
  assertSupabaseReady()

  const updates = orderedIds.map((id, index) =>
    supabase!.from('banners').update({ sort_order: index + 1 }).eq('id', id),
  )

  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)

  if (failed?.error) {
    throw new AdminBannerRepositoryError('배너 순서를 저장하지 못했습니다.', failed.error)
  }
}
