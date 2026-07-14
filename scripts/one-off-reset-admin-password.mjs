/**
 * ONE-OFF: Reset password for admintwotwo@twotwoshop.com only.
 *
 * - Uses auth.admin.updateUserById({ password }) only
 * - Does NOT change email, id, role, app_metadata, or user_profiles
 *
 * Usage (from project root):
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... NEW_ADMIN_PASSWORD='your-new-password' \
 *     node scripts/one-off-reset-admin-password.mjs
 *
 * Optional: put VITE_SUPABASE_URL (and optionally SUPABASE_SERVICE_ROLE_KEY)
 * in .env.local. Prefer passing the service role key via the shell, not committing it.
 *
 * DELETE THIS FILE after a successful run.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const TARGET_ADMIN_EMAIL = 'admintwotwo@twotwoshop.com'

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename)
  if (!existsSync(path)) {
    return {}
  }

  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index <= 0) continue
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const fileEnv = {
  ...loadEnvFile('.env'),
  ...loadEnvFile('.env.local'),
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || fileEnv.VITE_SUPABASE_URL
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY
const newPassword = process.env.NEW_ADMIN_PASSWORD

if (!url || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL (or SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Pass SUPABASE_SERVICE_ROLE_KEY via the shell; do not commit it.')
  process.exit(1)
}

if (!newPassword || newPassword.length < 8) {
  console.error('Set NEW_ADMIN_PASSWORD to a new password (min 8 characters).')
  console.error(
    "Example: NEW_ADMIN_PASSWORD='...' SUPABASE_SERVICE_ROLE_KEY=... node scripts/one-off-reset-admin-password.mjs",
  )
  process.exit(1)
}

const admin = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function findUserIdByEmail(email) {
  const normalized = email.trim().toLowerCase()
  let page = 1
  const perPage = 200

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw error
    }

    const users = data?.users ?? []
    const match = users.find((user) => (user.email ?? '').toLowerCase() === normalized)
    if (match) {
      return match
    }

    if (users.length < perPage) {
      return null
    }

    page += 1
  }
}

async function main() {
  console.log('[one-off] Looking up admin user by email only…')
  const user = await findUserIdByEmail(TARGET_ADMIN_EMAIL)

  if (!user) {
    console.error(`[one-off] User not found: ${TARGET_ADMIN_EMAIL}`)
    process.exit(1)
  }

  console.log('[one-off] Found user id (unchanged):', user.id)
  console.log('[one-off] Email (unchanged):', user.email)
  console.log(
    '[one-off] Existing app_metadata.role (unchanged):',
    user.app_metadata?.role ?? '(none)',
  )

  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (error) {
    console.error('[one-off] Password update failed:', error.message)
    process.exit(1)
  }

  const updated = data?.user
  console.log('[one-off] Password updated successfully.')
  console.log('[one-off] Verify unchanged fields:')
  console.log('  id   :', updated?.id)
  console.log('  email:', updated?.email)
  console.log('  role :', updated?.app_metadata?.role ?? '(none)')
  console.log('')
  console.log('Next: sign in at /admin/login with id "admintwotwo" and the new password.')
  console.log('Then DELETE this script: scripts/one-off-reset-admin-password.mjs')
}

main().catch((error) => {
  console.error('[one-off] Unexpected error:', error instanceof Error ? error.message : error)
  process.exit(1)
})
