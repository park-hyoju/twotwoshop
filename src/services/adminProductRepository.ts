import { buildProductCategoryPayload } from '../services/productMapper'
import { assertSupabaseMutationRow } from '../lib/adminSupabaseMutation'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { sanitizeSlug, sanitizeText } from '../utils/sanitize'
import { validateAdminProductInput, validateNonNegativeInteger, validatePrice } from '../utils/validators'
import type {
  AdminProductFormInput,
  AdminProductRow,
  AdminProductsQueryParams,
  AdminProductsQueryResult,
  AdminProductUpdateInput,
} from '../types/adminProduct'
import type { ProductStatus } from '../types/status'
import { isProductCategoryId } from '../constants/productCategories'

const PRODUCT_SELECT = `
  id,
  slug,
  name,
  price,
  stock,
  status,
  product_category,
  display_category,
  is_new,
  is_best,
  is_sale,
  created_at
`

export class AdminProductRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AdminProductRepositoryError'
    this.cause = cause
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new AdminProductRepositoryError(
      'Supabase 환경변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.',
    )
  }
}

function placeholderImage(slug: string): string {
  return `/images/placeholder/${slug}.jpg`
}

function normalizeAdminProductRow(row: AdminProductRow): AdminProductRow {
  return {
    ...row,
    is_new: row.is_new === true,
    is_best: row.is_best === true,
    is_sale: row.is_sale === true,
  }
}

function buildExposurePayload(input: Pick<AdminProductFormInput, 'isNew' | 'isBest' | 'isSale'>) {
  return {
    is_new: input.isNew === true,
    is_best: input.isBest === true,
    is_sale: input.isSale === true,
  }
}

function buildCreatePayload(input: AdminProductFormInput) {
  const slug = sanitizeSlug(input.slug)
  const name = sanitizeText(input.name, { maxLength: 200 })
  const thumbnail = placeholderImage(slug)
  const categoryFields = buildProductCategoryPayload(input.product_category)

  return {
    slug,
    name,
    short_description: name,
    description: name,
    price: input.price,
    original_price: input.price,
    discount_rate: 0,
    thumbnail,
    images: [thumbnail],
    ...categoryFields,
    tags: [],
    ...buildExposurePayload(input),
    stock: input.stock,
    display_order: 0,
    status: input.status,
  }
}

export async function fetchAdminProducts(
  params: AdminProductsQueryParams,
): Promise<AdminProductsQueryResult> {
  assertSupabaseReady()

  const { page, pageSize, filters } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase!
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  const name = filters.name.trim()
  const slug = filters.slug.trim()

  if (name) {
    query = query.ilike('name', `%${name}%`)
  }

  if (slug) {
    query = query.ilike('slug', `%${slug}%`)
  }

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.category !== 'all' && isProductCategoryId(filters.category)) {
    query = query.eq('product_category', filters.category)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new AdminProductRepositoryError(
      '상품 목록을 불러오지 못했습니다. Supabase RLS 정책(admin-products-rls.sql) 적용 여부를 확인해주세요.',
      error,
    )
  }

  return {
    products: (data ?? []).map((row) => normalizeAdminProductRow(row as AdminProductRow)),
    totalCount: count ?? 0,
  }
}

export async function createAdminProduct(input: AdminProductFormInput): Promise<string> {
  assertSupabaseReady()

  const validationError = validateAdminProductInput({
    slug: input.slug,
    name: input.name,
    price: input.price,
    stock: input.stock,
  })

  if (validationError) {
    throw new AdminProductRepositoryError(validationError)
  }

  const { data, error } = await supabase!
    .from('products')
    .insert(buildCreatePayload(input))
    .select('id')
    .single()

  if (error || !data) {
    throw new AdminProductRepositoryError('상품을 등록하지 못했습니다.', error)
  }

  return data.id
}

export async function updateAdminProduct(
  productId: string,
  input: AdminProductUpdateInput,
): Promise<AdminProductRow> {
  assertSupabaseReady()

  const validationError =
    validatePrice(input.price) ?? validateNonNegativeInteger(input.stock, '재고')

  if (validationError) {
    throw new AdminProductRepositoryError(validationError)
  }

  const categoryFields = buildProductCategoryPayload(input.product_category)

  const { data, error } = await supabase!
    .from('products')
    .update({
      price: input.price,
      stock: input.stock,
      status: input.status,
      ...buildExposurePayload(input),
      ...categoryFields,
    })
    .eq('id', productId)
    .select(PRODUCT_SELECT)
    .maybeSingle()

  const row = assertSupabaseMutationRow(
    data,
    error,
    '상품을 수정하지 못했습니다.',
    AdminProductRepositoryError,
  )

  return normalizeAdminProductRow(row as AdminProductRow)
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  assertSupabaseReady()

  const { error } = await supabase!.from('products').delete().eq('id', productId)

  if (error) {
    throw new AdminProductRepositoryError('상품을 삭제하지 못했습니다.', error)
  }
}

export async function setAdminProductSoldOut(productId: string): Promise<void> {
  assertSupabaseReady()

  const { data, error } = await supabase!
    .from('products')
    .update({ status: 'soldout', stock: 0 })
    .eq('id', productId)
    .select('id')
    .maybeSingle()

  assertSupabaseMutationRow(
    data,
    error,
    '품절 처리하지 못했습니다.',
    AdminProductRepositoryError,
  )
}

export async function setAdminProductVisibility(
  productId: string,
  visible: boolean,
): Promise<void> {
  assertSupabaseReady()

  const status: ProductStatus = visible ? 'active' : 'hidden'
  const { data, error } = await supabase!
    .from('products')
    .update({ status })
    .eq('id', productId)
    .select('id')
    .maybeSingle()

  assertSupabaseMutationRow(
    data,
    error,
    '노출 상태를 변경하지 못했습니다.',
    AdminProductRepositoryError,
  )
}
