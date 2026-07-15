/**
 * Admin inquiry Realtime hub (single subscription).
 *
 * Supabase Dashboard → Database → Replication에서
 * customer_inquiries, customer_inquiry_messages 테이블 Realtime 활성화 필요.
 * (또는 supabase/inquiry-realtime.sql 실행)
 */
import { useEffect, useRef } from 'react'
import {
  acquireAdminInquiryRealtimeChannel,
  releaseAdminInquiryRealtimeChannel,
} from '../lib/adminInquiryRealtimeChannel'
import {
  getAdminInquiryNotificationMessage,
  requestAdminNotificationPermission,
  resetAdminTabAlertCount,
  setAdminTabAlertTitle,
  showAdminBrowserNotification,
} from '../lib/adminInquiryNotification'
import {
  isAdminNotificationSoundEnabled,
  isAdminNotificationVoiceEnabled,
  playAdminNotificationAlert,
} from '../lib/adminInquiryNotificationSound'
import { isSupabaseConfigured } from '../lib/supabase'
import { fetchAdminInquirySummary } from '../services/adminInquiryRepository'
import type { AdminInquirySummaryStats } from '../types/adminInquiry'

const POLL_INTERVAL_MS = 15_000
const INITIAL_GUARD_MS = 1_500
/** Must be >= poll interval so realtime-notified creates are not double-alerted by polling. */
const POLL_NOTIFY_COOLDOWN_MS = 20_000
/** Dedupes inquiry INSERT + first message INSERT for the same new inquiry. */
const CREATION_NOTIFY_DEDUP_MS = 10_000

const EMPTY_SUMMARY: AdminInquirySummaryStats = {
  totalCount: 0,
  pendingCount: 0,
  answeredCount: 0,
  todayCount: 0,
  unreadCount: 0,
}

interface RealtimeRecord {
  id?: string
  sender?: string
  inquiry_id?: string
}

interface UseAdminInquiryRealtimeHubOptions {
  enabled: boolean
  onNotify: (message: string) => void
  onSummaryChange: (summary: AdminInquirySummaryStats) => void
  triggerListRefresh: () => void
  getSoundEnabled?: () => boolean
  getVoiceEnabled?: () => boolean
}

const lastNotifiedEventIds = new Set<string>()
const creationNotifiedAtByInquiryId = new Map<string, number>()
/** Tracks whether the first customer message for an inquiry was already suppressed. */
const firstCustomerMessageSeenByInquiryId = new Set<string>()
let lastNotificationPlayedAt = 0

function pruneNotifiedEventIds(): void {
  if (lastNotifiedEventIds.size <= 500) {
    return
  }

  const oldest = lastNotifiedEventIds.values().next().value
  if (oldest) {
    lastNotifiedEventIds.delete(oldest)
  }
}

function pruneFirstCustomerMessageSeen(): void {
  if (firstCustomerMessageSeenByInquiryId.size <= 500) {
    return
  }

  const oldest = firstCustomerMessageSeenByInquiryId.values().next().value
  if (oldest) {
    firstCustomerMessageSeenByInquiryId.delete(oldest)
  }
}

function claimNotificationKey(key: string): boolean {
  if (lastNotifiedEventIds.has(key)) {
    console.log('[realtime] duplicate event ignored', key)
    return false
  }

  lastNotifiedEventIds.add(key)
  pruneNotifiedEventIds()
  return true
}

function wasCreationRecentlyNotified(inquiryId: string): boolean {
  const notifiedAt = creationNotifiedAtByInquiryId.get(inquiryId)
  return notifiedAt !== undefined && Date.now() - notifiedAt < CREATION_NOTIFY_DEDUP_MS
}

function markCreationNotified(inquiryId: string): void {
  creationNotifiedAtByInquiryId.set(inquiryId, Date.now())

  if (creationNotifiedAtByInquiryId.size <= 500) {
    return
  }

  const oldest = creationNotifiedAtByInquiryId.keys().next().value
  if (oldest) {
    creationNotifiedAtByInquiryId.delete(oldest)
  }
}

function claimCreationAlert(inquiryId: string): boolean {
  const creationKey = `creation:${inquiryId}`
  if (!claimNotificationKey(creationKey)) {
    return false
  }

  markCreationNotified(inquiryId)
  return true
}

export function useAdminInquiryRealtimeHub(options: UseAdminInquiryRealtimeHubOptions): void {
  const {
    enabled,
    onNotify,
    onSummaryChange,
    triggerListRefresh,
    getSoundEnabled,
    getVoiceEnabled,
  } = options
  const onNotifyRef = useRef(onNotify)
  const onSummaryChangeRef = useRef(onSummaryChange)
  const triggerListRefreshRef = useRef(triggerListRefresh)
  const getSoundEnabledRef = useRef(getSoundEnabled)
  const getVoiceEnabledRef = useRef(getVoiceEnabled)
  const isReadyRef = useRef(false)
  const previousSummaryRef = useRef<AdminInquirySummaryStats>(EMPTY_SUMMARY)
  const isPollingRef = useRef(false)

  useEffect(() => {
    onNotifyRef.current = onNotify
  }, [onNotify])

  useEffect(() => {
    onSummaryChangeRef.current = onSummaryChange
  }, [onSummaryChange])

  useEffect(() => {
    triggerListRefreshRef.current = triggerListRefresh
  }, [triggerListRefresh])

  useEffect(() => {
    getSoundEnabledRef.current = getSoundEnabled
  }, [getSoundEnabled])

  useEffect(() => {
    getVoiceEnabledRef.current = getVoiceEnabled
  }, [getVoiceEnabled])

  useEffect(() => {
    requestAdminNotificationPermission()
  }, [])

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) {
      return
    }

    isReadyRef.current = false
    let isCancelled = false

    const readyTimer = window.setTimeout(() => {
      isReadyRef.current = true
    }, INITIAL_GUARD_MS)

    async function refreshSummary(options?: { syncBaseline?: boolean }): Promise<AdminInquirySummaryStats> {
      try {
        const summary = await fetchAdminInquirySummary()
        onSummaryChangeRef.current(summary)
        if (options?.syncBaseline) {
          previousSummaryRef.current = summary
        }
        return summary
      } catch {
        onSummaryChangeRef.current(EMPTY_SUMMARY)
        if (options?.syncBaseline) {
          previousSummaryRef.current = EMPTY_SUMMARY
        }
        return EMPTY_SUMMARY
      }
    }

    function refreshListData(): void {
      void refreshSummary({ syncBaseline: true }).then(() => {
        triggerListRefreshRef.current()
      })
    }

    function resolveSoundEnabled(): boolean {
      return getSoundEnabledRef.current?.() ?? isAdminNotificationSoundEnabled()
    }

    function resolveVoiceEnabled(): boolean {
      return getVoiceEnabledRef.current?.() ?? isAdminNotificationVoiceEnabled()
    }

    function runNotificationAlert(notificationKey: string): void {
      if (!isReadyRef.current) {
        return
      }

      if (!claimNotificationKey(notificationKey)) {
        return
      }

      const soundEnabled = resolveSoundEnabled()
      const voiceEnabled = resolveVoiceEnabled()
      console.log('[notification] current enabled:', soundEnabled)
      console.log('[notification] current voiceEnabled:', voiceEnabled)

      const message = getAdminInquiryNotificationMessage()
      onNotifyRef.current(message)
      showAdminBrowserNotification()
      setAdminTabAlertTitle()
      lastNotificationPlayedAt = Date.now()

      if (soundEnabled || voiceEnabled) {
        void playAdminNotificationAlert()
      }
    }

    function handleInquiryInserted(record: RealtimeRecord): void {
      if (!record.id) {
        return
      }

      console.log('[realtime] inquiry inserted', record.id)
      refreshListData()

      // New-inquiry alerts (sound + voice) are owned only by customer_inquiries INSERT.
      if (wasCreationRecentlyNotified(record.id) || !claimCreationAlert(record.id)) {
        console.log('[realtime] duplicate event ignored', `inquiry:${record.id}`)
        return
      }

      runNotificationAlert(`inquiry:${record.id}`)
    }

    function handleCustomerMessageInserted(record: RealtimeRecord): void {
      if (!record.id || !record.inquiry_id || record.sender !== 'customer') {
        return
      }

      const notificationKey = `message:${record.id}`
      const inquiryId = record.inquiry_id

      console.log('[realtime] message inserted', record.id)
      refreshListData()

      const isFirstCustomerMessage = !firstCustomerMessageSeenByInquiryId.has(inquiryId)
      if (isFirstCustomerMessage) {
        firstCustomerMessageSeenByInquiryId.add(inquiryId)
        pruneFirstCustomerMessageSeen()
      }

      // First customer message of a new inquiry (pairs with inquiries INSERT) — never alert.
      if (isFirstCustomerMessage || wasCreationRecentlyNotified(inquiryId)) {
        console.log('[realtime] duplicate event ignored', notificationKey)
        return
      }

      // Follow-up customer message only.
      runNotificationAlert(notificationKey)
    }

    acquireAdminInquiryRealtimeChannel((channel) =>
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'customer_inquiries' },
          (payload) => {
            handleInquiryInserted(payload.new as RealtimeRecord)
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'customer_inquiries' },
          () => {
            refreshListData()
          },
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'customer_inquiry_messages' },
          (payload) => {
            handleCustomerMessageInserted(payload.new as RealtimeRecord)
          },
        )
        .subscribe((status, error) => {
          if (status === 'SUBSCRIBED') {
            console.log('[realtime] admin inquiry hub subscribed')
            return
          }

          if (error) {
            console.error('[realtime] admin inquiry hub subscribe error', error)
          }
        }),
    )

    void refreshSummary().then((summary) => {
      if (!isCancelled) {
        previousSummaryRef.current = summary
      }
    })

    const pollTimer = window.setInterval(() => {
      if (isPollingRef.current) {
        return
      }

      isPollingRef.current = true
      void refreshSummary()
        .then((summary) => {
          const previous = previousSummaryRef.current
          const pendingIncreased = summary.pendingCount > previous.pendingCount
          const unreadIncreased = summary.unreadCount > previous.unreadCount
          const totalIncreased = summary.totalCount > previous.totalCount
          const countsChanged = pendingIncreased || unreadIncreased || totalIncreased

          if (countsChanged) {
            triggerListRefreshRef.current()
          }

          const recentlyNotified = Date.now() - lastNotificationPlayedAt < POLL_NOTIFY_COOLDOWN_MS
          if (
            isReadyRef.current &&
            (pendingIncreased || unreadIncreased) &&
            !recentlyNotified
          ) {
            const notificationKey = `polling:${summary.pendingCount}:${summary.unreadCount}`
            runNotificationAlert(notificationKey)
          }

          previousSummaryRef.current = summary
        })
        .finally(() => {
          isPollingRef.current = false
        })
    }, POLL_INTERVAL_MS)

    return () => {
      isCancelled = true
      window.clearTimeout(readyTimer)
      window.clearInterval(pollTimer)
      releaseAdminInquiryRealtimeChannel()
    }
  }, [enabled])
}

export function useAdminInquiryTabTitleReset(active: boolean): void {
  useEffect(() => {
    if (active) {
      resetAdminTabAlertCount()
    }
  }, [active])

  useEffect(() => {
    return () => {
      resetAdminTabAlertCount()
    }
  }, [])
}
