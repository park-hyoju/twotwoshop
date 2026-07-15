import { supabase } from './supabase'

/** Best-effort products.updated_at for draft stale checks. Never throws. */
export async function fetchAdminProductUpdatedAt(productId: string): Promise<string | null> {
  if (!supabase || !productId.trim()) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('updated_at')
      .eq('id', productId)
      .maybeSingle()

    if (error || !data || typeof (data as { updated_at?: unknown }).updated_at !== 'string') {
      return null
    }

    return (data as { updated_at: string }).updated_at
  } catch {
    return null
  }
}
