/**
 * Purge seed/demo products from Supabase, keeping admin-registered products only.
 *
 * Usage: node scripts/purge-non-admin-products.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SEED_PRODUCT_SLUGS = [
  'classic-linen-shirt',
  'wide-slacks-pants',
  'flower-midi-dress',
  'canvas-low-sneakers-w',
  'daily-crossbag',
  'summer-blouse',
  'premium-leather-belt-w',
  'ribbon-scarf',
  'mini-tote-bag',
  'soft-knit-cardigan',
  'women-baseball-cap',
  'cooling-golf-tee',
  'stretch-chino-pants',
  'overfit-denim-jacket',
  'lightweight-runner-shoes',
  'basic-leather-belt',
  'airy-cargo-shorts',
  'linen-shirts-m',
  'canvas-low-sneakers-m',
  'leather-wallet',
  'men-baseball-cap',
  'classic-loafers',
]

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  const env = {}

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index <= 0) continue
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1)
  }

  return env
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function deleteByIds(ids) {
  if (ids.length === 0) {
    return 0
  }

  const { error } = await supabase.from('products').delete().in('id', ids)
  if (error) {
    throw new Error(error.message)
  }

  return ids.length
}

async function main() {
  const { data: beforeRows, error: beforeError } = await supabase
    .from('products')
    .select('id, slug, name, thumbnail')

  if (beforeError) {
    console.error('Failed to list products:', beforeError.message)
    process.exit(1)
  }

  const beforeCount = beforeRows?.length ?? 0
  const seedSlugSet = new Set(SEED_PRODUCT_SLUGS)

  const seedIds = (beforeRows ?? [])
    .filter((row) => seedSlugSet.has(row.slug))
    .map((row) => row.id)

  const placeholderIds = (beforeRows ?? [])
    .filter(
      (row) =>
        typeof row.thumbnail === 'string' && row.thumbnail.startsWith('/images/placeholder/'),
    )
    .map((row) => row.id)

  const deleteIds = [...new Set([...seedIds, ...placeholderIds])]
  const deletedCount = await deleteByIds(deleteIds)

  const { data: afterRows, error: afterError } = await supabase
    .from('products')
    .select('id, slug, name')

  if (afterError) {
    console.error('Failed to count remaining products:', afterError.message)
    process.exit(1)
  }

  console.log(
    JSON.stringify(
      {
        beforeCount,
        deletedCount,
        remainingCount: afterRows?.length ?? 0,
        remainingProducts: afterRows,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
