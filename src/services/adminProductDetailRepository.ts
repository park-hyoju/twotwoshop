import { assertSupabaseMutationRow, formatPostgrestErrorMessage } from '../lib/adminSupabaseMutation'
import { assertAdminRepositoryAccess } from '../lib/adminRepositoryGuard'
import {
  EMPTY_RETURN_INFO,
  EMPTY_SHIPPING_INFO,
  EMPTY_SIZE_GUIDE,
} from '../lib/adminProductDetailDefaults'
import { generateProductSlugFromName, resolveUniqueProductSlug } from '../lib/productSlug'
import { supabase } from '../lib/supabase'
import type { AdminProductDetailChangeSet } from '../components/admin/products/detail/editor/productSaveChanges'
import type { AdminProductDetailForm } from '../types/adminProductDetail'
import { buildProductCategoryPayload } from './productMapper'
import {
  buildAdminProductDetailPartialUpdatePayload,
  mapAdminProductDetailFormToDescriptionUpdatePayload,
  mapAdminProductDetailFormToFullUpdatePayload,
  mapRowToAdminProductDetailForm,
  type AdminProductDetailRow,
} from './adminProductDetailMapper'
import { fetchAdminRelatedProducts, saveAdminRelatedProducts } from './adminProductRelatedRepository'
import {
  cloneOptionGroupsForNewProduct,
  cloneVariantsForNewProduct,
} from '../lib/adminProductOptions'

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
      formatPostgrestErrorMessage(
        '상품 상세를 불러오지 못했습니다. product-detail-v093.sql migration 적용 여부를 확인해주세요.',
        error,
      ),
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

  const payload = mapAdminProductDetailFormToFullUpdatePayload(form)

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

export async function saveAdminProductDetailPartial(
  form: AdminProductDetailForm,
  baseline: AdminProductDetailForm,
  changes: AdminProductDetailChangeSet,
): Promise<AdminProductDetailForm> {
  await ensureAdminAccess()

  const payload = buildAdminProductDetailPartialUpdatePayload(baseline, form, changes)

  if (Object.keys(payload).length === 0) {
    return fetchAdminProductDetail(form.id)
  }

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

export async function saveAdminProductDetailDescription(
  form: AdminProductDetailForm,
): Promise<AdminProductDetailForm> {
  await ensureAdminAccess()

  const payload = mapAdminProductDetailFormToDescriptionUpdatePayload(form)

  const { data, error } = await supabase!
    .from('products')
    .update(payload)
    .eq('id', form.id)
    .select(PRODUCT_DETAIL_SELECT)
    .maybeSingle()

  const row = assertSupabaseMutationRow(
    data,
    error,
    '상품 상세설명을 저장하지 못했습니다.',
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
      size_guide: { ...EMPTY_SIZE_GUIDE, rows: [] },
      product_info: {},
      shipping_info: { ...EMPTY_SHIPPING_INFO },
      return_info: { ...EMPTY_RETURN_INFO },
    is_new: false,
    is_best: false,
    is_sale: false,
    ...categoryFields,
    })
    .select('id')
    .single()

  if (error) {
    if (import.meta.env.DEV) {
      console.error('[createBlankAdminProduct] insert failed', error)
    }
    throw new AdminProductDetailRepositoryError(
      formatPostgrestErrorMessage('새 상품을 만들지 못했습니다.', error),
      error,
    )
  }

  if (!data) {
    throw new AdminProductDetailRepositoryError('새 상품을 만들지 못했습니다.')
  }

  return data.id
}

export async function copyAdminProduct(sourceProductId: string): Promise<string> {
  await ensureAdminAccess()

  const source = await fetchAdminProductDetail(sourceProductId)
  const copyName = source.name.trim() ? `${source.name.trim()} (복사)` : '새 상품 (복사)'
  const slug = await resolveUniqueProductSlug(generateProductSlugFromName(copyName))
  const payload = mapAdminProductDetailFormToFullUpdatePayload({
    ...source,
    name: copyName,
    slug,
    status: 'hidden',
    optionGroups: cloneOptionGroupsForNewProduct(source.optionGroups),
    variants: cloneVariantsForNewProduct(source.variants),
  })

  const { data, error } = await supabase!
    .from('products')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    if (import.meta.env.DEV) {
      console.error('[copyAdminProduct] insert failed', error)
    }
    throw new AdminProductDetailRepositoryError(
      formatPostgrestErrorMessage('상품을 복사하지 못했습니다.', error),
      error,
    )
  }

  if (!data) {
    throw new AdminProductDetailRepositoryError('상품을 복사하지 못했습니다.')
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
