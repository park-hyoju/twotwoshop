import { assertSupabaseMutationRow } from '../lib/adminSupabaseMutation'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { AdminProductDetailForm } from '../types/adminProductDetail'
import {
  mapAdminProductDetailFormToUpdatePayload,
  mapRowToAdminProductDetailForm,
  type AdminProductDetailRow,
} from './adminProductDetailMapper'

const PRODUCT_DETAIL_SELECT = `
  id,
  slug,
  name,
  short_description,
  description,
  price,
  original_price,
  discount_rate,
  thumbnail,
  images,
  gender,
  display_category,
  detail_category,
  stock,
  status,
  brand,
  sku,
  meta_title,
  meta_description,
  size_guide,
  product_info,
  shipping_info,
  return_info
`

export class AdminProductDetailRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminProductDetailRepositoryError'
    this.cause = cause
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new AdminProductDetailRepositoryError(
      'Supabase 환경변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.',
    )
  }
}

export async function fetchAdminProductDetail(
  productId: string,
): Promise<AdminProductDetailForm> {
  assertSupabaseReady()

  const { data, error } = await supabase!
    .from('products')
    .select(PRODUCT_DETAIL_SELECT)
    .eq('id', productId)
    .maybeSingle()

  if (error) {
    throw new AdminProductDetailRepositoryError(
      '상품 상세를 불러오지 못했습니다. product-detail-v093.sql migration 적용 여부를 확인해주세요.',
      error,
    )
  }

  if (!data) {
    throw new AdminProductDetailRepositoryError('상품을 찾을 수 없습니다.')
  }

  return mapRowToAdminProductDetailForm(data as AdminProductDetailRow)
}

export async function saveAdminProductDetail(
  form: AdminProductDetailForm,
): Promise<AdminProductDetailForm> {
  assertSupabaseReady()

  const payload = mapAdminProductDetailFormToUpdatePayload(form)

  const { data, error } = await supabase!
    .from('products')
    .update(payload)
    .eq('id', form.id)
    .select(PRODUCT_DETAIL_SELECT)
    .maybeSingle()

  const row = assertSupabaseMutationRow(
    data,
    error,
    '상품 상세를 저장하지 못했습니다.',
    AdminProductDetailRepositoryError,
  )

  return mapRowToAdminProductDetailForm(row as AdminProductDetailRow)
}
