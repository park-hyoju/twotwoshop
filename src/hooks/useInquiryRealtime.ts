/**
 * Admin inquiry list realtime (per-page).
 * Global hub: useAdminInquiryRealtimeHub in AdminLayout via AdminInquiryRealtimeProvider.
 *
 * Supabase Dashboard → Database → Replication에서
 * customer_inquiries, customer_inquiry_messages Realtime 활성화 필요.
 */
import { useEffect } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { fetchCustomerInquiryById } from '../services/customerInquiryRepository'
import type { CustomerInquiryThread } from '../types/customerInquiry'

export function useAdminInquiryChatRealtime(options: {
  inquiryId: string | null
  enabled: boolean
  onRefresh: () => void
}): void {
  const { inquiryId, enabled, onRefresh } = options

  useEffect(() => {
    if (!enabled || !inquiryId || !isSupabaseConfigured || !supabase) {
      return
    }

    const channel = supabase
      .channel(`admin-inquiry-chat:${inquiryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_inquiry_messages',
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        () => {
          onRefresh()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customer_inquiries',
          filter: `id=eq.${inquiryId}`,
        },
        () => {
          onRefresh()
        },
      )
      .subscribe()

    return () => {
      void supabase!.removeChannel(channel)
    }
  }, [enabled, inquiryId, onRefresh])
}

export function useAdminInquiryListRealtime(options: {
  enabled: boolean
  onListChange: () => void
  onSummaryChange: () => void
}): void {
  const { enabled, onListChange, onSummaryChange } = options

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured || !supabase) {
      return
    }

    const channel = supabase
      .channel('admin-inquiry-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customer_inquiries' },
        () => {
          onListChange()
          onSummaryChange()
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'customer_inquiries' },
        () => {
          onListChange()
          onSummaryChange()
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customer_inquiry_messages' },
        () => {
          onListChange()
          onSummaryChange()
        },
      )
      .subscribe()

    return () => {
      void supabase!.removeChannel(channel)
    }
  }, [enabled, onListChange, onSummaryChange])
}

export function useCustomerThreadRefresh(options: {
  inquiryId: string
  name: string
  phone: string
  enabled: boolean
  onThreadUpdate: (thread: CustomerInquiryThread) => void
  intervalMs?: number
}): void {
  const { inquiryId, name, phone, enabled, onThreadUpdate, intervalMs = 3000 } = options

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) {
      return
    }

    let isCancelled = false

    async function refreshThread() {
      try {
        const thread = await fetchCustomerInquiryById({ inquiryId, name, phone })
        if (!isCancelled && thread) {
          onThreadUpdate(thread)
        }
      } catch {
        // Polling failures are non-fatal; next tick will retry.
      }
    }

    void refreshThread()
    const timer = window.setInterval(() => {
      void refreshThread()
    }, intervalMs)

    return () => {
      isCancelled = true
      window.clearInterval(timer)
    }
  }, [enabled, inquiryId, intervalMs, name, onThreadUpdate, phone])
}
