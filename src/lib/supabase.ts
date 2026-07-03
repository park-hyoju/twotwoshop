import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Trailing slash breaks `/functions/v1/{name}` resolution in some clients. */
const supabaseUrl =
  typeof rawSupabaseUrl === 'string' ? rawSupabaseUrl.trim().replace(/\/+$/, '') : rawSupabaseUrl

export const isSupabaseConfigured =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.length > 0 &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.length > 0

let supabaseClient: SupabaseClient | null = null

if (isSupabaseConfigured) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase = supabaseClient

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient
}
