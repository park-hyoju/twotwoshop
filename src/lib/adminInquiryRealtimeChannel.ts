import type { RealtimeChannel } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'

export const ADMIN_INQUIRY_REALTIME_CHANNEL_NAME = 'admin-inquiry-realtime'

let activeChannel: RealtimeChannel | null = null
let subscriberCount = 0

export function acquireAdminInquiryRealtimeChannel(
  setup: (channel: RealtimeChannel) => RealtimeChannel,
): RealtimeChannel | null {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  subscriberCount += 1

  if (!activeChannel) {
    activeChannel = setup(supabase.channel(ADMIN_INQUIRY_REALTIME_CHANNEL_NAME))
  }

  return activeChannel
}

export function releaseAdminInquiryRealtimeChannel(): void {
  subscriberCount = Math.max(0, subscriberCount - 1)

  if (subscriberCount === 0 && activeChannel && supabase) {
    void supabase.removeChannel(activeChannel)
    activeChannel = null
  }
}

export function getActiveAdminInquiryRealtimeChannel(): RealtimeChannel | null {
  return activeChannel
}
