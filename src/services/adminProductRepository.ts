import { getAdminProductTotalStock } from '../lib/adminProductStock'
import { buildProductCategoryPayload } from '../services/productMapper'
import { assertSupabaseMutationRow } from '../lib/adminSupabaseMutation'
import { assertAdminRepositoryAccess } from '../lib/adminRepositoryGuard'
import { generateProductSlugFromName, resolveUniqueProductSlug } from '../lib/productSlug'
import { supabase } from '../lib/supabase'
import { sanitizeText } from '../utils/sanitize'
import {
  validateAdminProductFormInput,
  validateNonNegativeInteger,
  validatePrice,
} from '../utils/validators'
import type {
  AdminProductFormFiles,
  AdminProductFormInput,
  AdminProductRow,
  AdminProductsQueryParams,
  AdminProductsQueryResult,
  AdminProductUpdateInput,
} from '../types/adminProduct'
import type { ProductStatus } from '../types/status'
import { isProductCategoryId, resolveProductCategory } from '../constants/productCategories'
import {
  ProductImageUploadError,
  uploadProductImage,
} from './adminProductImageUploadService'

const PRODUCT_SELECT = `
  id,
  slug,
  name,
  price,
  original_price,
  discount_rate,
  stock,
  status,
  product_category,
  display_category,
  is_new,
  is_best,
  is_sale,
  thumbnail,
  description,
  images,
  product_info,
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

async function ensureAdminAccess(): Promise<void> {
  await assertAdminRepositoryAccess(AdminProductRepositoryError)
}

type AdminProductRowInput = Omit<AdminProductRow, 'total_stock'> & { product_info?: unknown }

function normalizeAdminProductRow(row: AdminProductRowInput): AdminProductRow {
  const stock = row.stock ?? 0

  return {
    ...row,
    stock,
    total_stock: getAdminProductTotalStock(stock, row.product_info),
    original_price: row.original_price ?? row.price,
    discount_rate: row.discount_rate ?? 0,
    is_new: row.is_new === true,
    is_best: row.is_best === true,
    is_sale: row.is_sale === true,
    images: Array.isArray(row.images) ? row.images : [],
  }
}

function buildExposurePayload(input: Pick<AdminProductFormInput, 'isNew' | 'isBest' | 'isSale'>) {
  return {
    is_new: input.isNew === true,
    is_best: input.isBest === true,
    is_sale: input.isSale === true,
  }
}

function buildBasePayload(input: AdminProductFormInput, slug: string) {
  const name = sanitizeText(input.name, { maxLength: 200 })
  const description = sanitizeText(input.description, { maxLength: 5000 })
  const categoryFields = buildProductCategoryPayload(input.product_category)

  return {
    slug,
    name,
    short_description: description.slice(0, 200) || name,
    description: description || name,
    price: input.price,
    original_price: input.price,
    discount_rate: 0,
    ...categoryFields,
    tags: [],
    ...buildExposurePayload(input),
    stock: input.stock,
    display_order: 0,
    status: input.stock <= 0 && input.status === 'active' ? 'soldout' : input.status,
  }
}

async function uploadThumbnail(productId: string, file: File): Promise<string> {
  try {
    return await uploadProductImage(productId, file, 'thumbnail')
  } catch (error) {
    if (error instanceof ProductImageUploadError) {
      throw new AdminProductRepositoryError(error.message, error)
    }
    throw new AdminProductRepositoryError('대표 이미지 업로드에 실패했습니다.', error)
  }
}

async function uploadAdditionalImages(productId: string, files: File[]): Promise<string[]> {
  const urls: string[] = []

  for (const file of files) {
    try {
      urls.push(await uploadProductImage(productId, file, 'detail'))
    } catch (error) {
      if (error instanceof ProductImageUploadError) {
        throw new AdminProductRepositoryError(error.message, error)
      }
      throw new AdminProductRepositoryError('추가 이미지 업로드에 실패했습니다.', error)
    }
  }

  return urls
}

export async function fetchAdminProducts(
  params: AdminProductsQueryParams,
): Promise<AdminProductsQueryResult> {
  await ensureAdminAccess()

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
    products: (data ?? []).map((row) => normalizeAdminProductRow(row as AdminProductRowInput)),
    totalCount: count ?? 0,
  }
}

export async function fetchAdminProductForForm(productId: string): Promise<{
  input: AdminProductFormInput
  thumbnailUrl: string | null
  additionalUrls: string[]
}> {
  await ensureAdminAccess()

  const { data, error } = await supabase!
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', productId)
    .maybeSingle()

  if (error || !data) {
    throw new AdminProductRepositoryError('상품 정보를 불러오지 못했습니다.', error)
  }

  const row = normalizeAdminProductRow(data as AdminProductRowInput)
  const images = row.images ?? []
  const thumbnailUrl = row.thumbnail
  const additionalUrls = images.filter((url) => url && url !== thumbnailUrl)

  return {
    input: {
      slug: row.slug,
      name: row.name,
      price: row.price,
      stock: row.stock,
      status: row.status,
      product_category: resolveProductCategory({
        product_category: row.product_category,
        display_category: row.display_category,
      }),
      isNew: row.is_new,
      isBest: row.is_best,
      isSale: row.is_sale,
      description: row.description ?? '',
    },
    thumbnailUrl,
    additionalUrls,
  }
}

export async function saveAdminProductForm(
  mode: 'create' | 'edit',
  productId: string | null,
  input: AdminProductFormInput,
  files: AdminProductFormFiles,
): Promise<string> {
  await ensureAdminAccess()

  const hasThumbnail = Boolean(files.thumbnail || files.existingThumbnailUrl)
  const validationError = validateAdminProductFormInput({
    name: input.name,
    price: input.price,
    stock: input.stock,
    hasThumbnail,
  })

  if (validationError) {
    throw new AdminProductRepositoryError(validationError)
  }

  const baseSlug = input.slug.trim() || generateProductSlugFromName(input.name)
  const slug = await resolveUniqueProductSlug(
    baseSlug,
    mode === 'edit' ? productId ?? undefined : undefined,
  )

  const basePayload = buildBasePayload({ ...input, slug }, slug)

  let targetId = productId

  if (mode === 'create') {
    const { data, error } = await supabase!
      .from('products')
      .insert({
        ...basePayload,
        thumbnail: files.existingThumbnailUrl ?? '',
        images: files.existingThumbnailUrl ? [files.existingThumbnailUrl] : [],
      })
      .select('id')
      .single()

    if (error || !data) {
      throw new AdminProductRepositoryError('상품을 등록하지 못했습니다.', error)
    }

    targetId = data.id
  } else if (!targetId) {
    throw new AdminProductRepositoryError('수정할 상품을 찾을 수 없습니다.')
  } else {
    const { error } = await supabase!
      .from('products')
      .update({
        ...basePayload,
      })
      .eq('id', targetId)

    if (error) {
      throw new AdminProductRepositoryError('상품을 수정하지 못했습니다.', error)
    }
  }

  const id = targetId!

  let thumbnailUrl = files.existingThumbnailUrl ?? ''

  if (files.thumbnail) {
    thumbnailUrl = await uploadThumbnail(id, files.thumbnail)
  }

  if (!thumbnailUrl) {
    throw new AdminProductRepositoryError('대표 이미지를 등록해주세요.')
  }

  const uploadedAdditional = files.additionalImages.length
    ? await uploadAdditionalImages(id, files.additionalImages)
    : []

  const allImages = [thumbnailUrl, ...files.retainedAdditionalUrls, ...uploadedAdditional]

  const { error: imageError } = await supabase!
    .from('products')
    .update({
      thumbnail: thumbnailUrl,
      images: allImages,
    })
    .eq('id', id)

  if (imageError) {
    throw new AdminProductRepositoryError('상품 이미지 정보를 저장하지 못했습니다.', imageError)
  }

  return id
}

/** @deprecated Use saveAdminProductForm */
export async function createAdminProduct(input: AdminProductFormInput): Promise<string> {
  return saveAdminProductForm(
    'create',
    null,
    input,
    {
      thumbnail: null,
      additionalImages: [],
      retainedAdditionalUrls: [],
      existingThumbnailUrl: null,
    },
  )
}

export async function updateAdminProduct(
  productId: string,
  input: AdminProductUpdateInput,
): Promise<AdminProductRow> {
  await ensureAdminAccess()

  const validationError =
    validatePrice(input.price) ?? validateNonNegativeInteger(input.stock, '재고 수량')

  if (validationError) {
    throw new AdminProductRepositoryError(validationError)
  }

  const categoryFields = buildProductCategoryPayload(input.product_category)

  const { data, error } = await supabase!
    .from('products')
    .update({
      slug: input.slug,
      name: input.name,
      price: input.price,
      stock: input.stock,
      status: input.status,
      description: input.description,
      short_description: input.description.slice(0, 200),
      thumbnail: input.thumbnail,
      images: input.images,
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

  return normalizeAdminProductRow(row as AdminProductRowInput)
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  await ensureAdminAccess()

  const { error } = await supabase!.from('products').delete().eq('id', productId)

  if (error) {
    throw new AdminProductRepositoryError('상품을 삭제하지 못했습니다.', error)
  }
}

export async function setAdminProductSoldOut(productId: string): Promise<void> {
  await ensureAdminAccess()

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
  await ensureAdminAccess()

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
