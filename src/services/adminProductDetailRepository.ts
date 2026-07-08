import { assertSupabaseMutationRow } from '../lib/adminSupabaseMutation'
import { assertAdminRepositoryAccess } from '../lib/adminRepositoryGuard'
import {
  EMPTY_RETURN_INFO,
  EMPTY_SHIPPING_INFO,
  EMPTY_SIZE_GUIDE,
} from '../lib/adminProductDetailDefaults'
import { generateProductSlugFromName, resolveUniqueProductSlug } from '../lib/productSlug'
import { supabase } from '../lib/supabase'
import type { AdminProductDetailForm } from '../types/adminProductDetail'
import { buildProductCategoryPayload } from './productMapper'
import {
  mapAdminProductDetailFormToUpdatePayload,
  mapRowToAdminProductDetailForm,
  type AdminProductDetailRow,
} from './adminProductDetailMapper'
import { fetchAdminRelatedProducts, saveAdminRelatedProducts } from './adminProductRelatedRepository'

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
  product_category,
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
  return_info,
  detail_media,
  is_new,
  is_best,
  is_sale
`

export class AdminProductDetailRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminProductDetailRepositoryError'
    this.cause = cause
  }
}

async function ensureAdminAccess(): Promise<void> {
  await assertAdminRepositoryAccess(AdminProductDetailRepositoryError)
}

export async function fetchAdminProductDetail(
  productId: string,
): Promise<AdminProductDetailForm> {
  await ensureAdminAccess()

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
  await ensureAdminAccess()

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

export async function createBlankAdminProduct(): Promise<string> {
  await ensureAdminAccess()

  const slug = await resolveUniqueProductSlug(`product-${Date.now().toString(36)}`)
  const categoryFields = buildProductCategoryPayload('etc')

  const { data, error } = await supabase!
    .from('products')
    .insert({
      slug,
      name: '',
      status: 'hidden',
      price: 0,
      original_price: 0,
      discount_rate: 0,
      stock: 0,
      thumbnail: '',
      images: [],
      short_description: '',
      description: '',
      detail_media: [],
      size_guide: { ...EMPTY_SIZE_GUIDE, rows: [] },
      product_info: {},
      shipping_info: { ...EMPTY_SHIPPING_INFO },
      return_info: { ...EMPTY_RETURN_INFO },
    is_new: false,
    is_best: false,
    is_sale: false,
    is_admin_registered: true,
    ...categoryFields,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new AdminProductDetailRepositoryError('새 상품을 만들지 못했습니다.', error)
  }

  return data.id
}

export async function copyAdminProduct(sourceProductId: string): Promise<string> {
  await ensureAdminAccess()

  const source = await fetchAdminProductDetail(sourceProductId)
  const copyName = source.name.trim() ? `${source.name.trim()} (복사)` : '새 상품 (복사)'
  const slug = await resolveUniqueProductSlug(generateProductSlugFromName(copyName))
  const payload = mapAdminProductDetailFormToUpdatePayload({
    ...source,
    name: copyName,
    slug,
    status: 'hidden',
  })

  const { data, error } = await supabase!
    .from('products')
    .insert(payload)
    .select('id')
    .single()

  if (error || !data) {
    throw new AdminProductDetailRepositoryError('상품을 복사하지 못했습니다.', error)
  }

  const relatedProducts = await fetchAdminRelatedProducts(sourceProductId)
  if (relatedProducts.length > 0) {
    await saveAdminRelatedProducts(
      data.id,
      relatedProducts.map((item) => item.id),
    )
  }

  return data.id
}
