import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { RelatedProductPick } from '../types/adminProductRelated'
import { MAX_RELATED_PRODUCTS } from '../types/adminProductRelated'
import { AdminProductRepositoryError } from './adminProductRepository'

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new AdminProductRepositoryError(
      'Supabase 환경변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.',
    )
  }
}

const RELATED_PRODUCT_SELECT = `
  id,
  slug,
  name,
  price,
  thumbnail
`

function mapRelatedProductPick(row: {
  id: string
  slug: string
  name: string
  price: number
  thumbnail: string | null
}): RelatedProductPick {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    thumbnail: row.thumbnail ?? `/images/placeholder/${row.slug}.jpg`,
  }
}

export async function searchAdminProductsForRelated(
  query: string,
  excludeProductId?: string | null,
): Promise<RelatedProductPick[]> {
  assertSupabaseReady()

  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  let request = supabase!
    .from('products')
    .select(RELATED_PRODUCT_SELECT)
    .ilike('name', `%${trimmed}%`)
    .order('name', { ascending: true })
    .limit(20)

  if (excludeProductId) {
    request = request.neq('id', excludeProductId)
  }

  const { data, error } = await request

  if (error) {
    throw new AdminProductRepositoryError('연관상품 검색에 실패했습니다.', error)
  }

  return (data ?? []).map(mapRelatedProductPick)
}

export async function fetchAdminRelatedProducts(
  productId: string,
): Promise<RelatedProductPick[]> {
  assertSupabaseReady()

  const { data: links, error: linksError } = await supabase!
    .from('product_related')
    .select('related_product_id, sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (linksError) {
    throw new AdminProductRepositoryError('연관상품을 불러오지 못했습니다.', linksError)
  }

  if (!links || links.length === 0) {
    return []
  }

  const relatedIds = links.map((link) => link.related_product_id)

  const { data: products, error: productsError } = await supabase!
    .from('products')
    .select(RELATED_PRODUCT_SELECT)
    .in('id', relatedIds)

  if (productsError) {
    throw new AdminProductRepositoryError('연관상품 정보를 불러오지 못했습니다.', productsError)
  }

  const productById = new Map(
    (products ?? []).map((row) => [row.id, mapRelatedProductPick(row)]),
  )

  return links
    .map((link) => productById.get(link.related_product_id))
    .filter((item): item is RelatedProductPick => item !== undefined)
}

export async function saveAdminRelatedProducts(
  productId: string,
  relatedProductIds: string[],
): Promise<void> {
  assertSupabaseReady()

  const uniqueIds = [...new Set(relatedProductIds)].filter((id) => id !== productId)

  if (uniqueIds.length > MAX_RELATED_PRODUCTS) {
    throw new AdminProductRepositoryError(
      `연관상품은 최대 ${MAX_RELATED_PRODUCTS}개까지 선택할 수 있습니다.`,
    )
  }

  const { error: deleteError } = await supabase!
    .from('product_related')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    throw new AdminProductRepositoryError('기존 연관상품을 삭제하지 못했습니다.', deleteError)
  }

  if (uniqueIds.length === 0) {
    return
  }

  const rows = uniqueIds.map((relatedProductId, index) => ({
    product_id: productId,
    related_product_id: relatedProductId,
    sort_order: index,
  }))

  const { error: insertError } = await supabase!.from('product_related').insert(rows)

  if (insertError) {
    throw new AdminProductRepositoryError('연관상품을 저장하지 못했습니다.', insertError)
  }
}
