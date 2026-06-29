/**
 * Phase 2: PWA Web Push (not implemented)
 *
 * Browser tab notifications only work while an admin tab is open.
 * When the browser is fully closed, alerts cannot be delivered with the
 * current setup.
 *
 * Future work:
 * - Register a service worker for the admin app shell
 * - Subscribe admins to Web Push (VAPID keys + push subscription storage)
 * - Send push from Supabase Edge Function / database webhook on new inquiries
 * - Handle notificationclick to deep-link into /admin/chat
 */

export const ADMIN_WEB_PUSH_STATUS = {
  phase: 1,
  description: 'In-tab Realtime alerts only (sound, toast, Notification API, tab title)',
} as const

export function isWebPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}
