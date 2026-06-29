import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAdminInquirySound } from './AdminInquirySoundContext'
import { useAdminInquiryRealtimeHub } from '../hooks/useAdminInquiryRealtimeHub'
import type { AdminInquirySummaryStats } from '../types/adminInquiry'

const EMPTY_SUMMARY: AdminInquirySummaryStats = {
  totalCount: 0,
  pendingCount: 0,
  answeredCount: 0,
  todayCount: 0,
  unreadCount: 0,
}

interface AdminInquiryRealtimeContextValue {
  summary: AdminInquirySummaryStats
  unreadCount: number
  subscribeListRefresh: (callback: () => void) => () => void
}

const AdminInquiryRealtimeContext = createContext<AdminInquiryRealtimeContextValue | null>(null)

interface AdminInquiryRealtimeProviderProps {
  enabled: boolean
  onNotify: (message: string) => void
  children: ReactNode
}

export function AdminInquiryRealtimeProvider({
  enabled,
  onNotify,
  children,
}: AdminInquiryRealtimeProviderProps) {
  const { isSoundEnabled, isVoiceEnabled } = useAdminInquirySound()
  const [summary, setSummary] = useState<AdminInquirySummaryStats>(EMPTY_SUMMARY)
  const listRefreshListenersRef = useRef(new Set<() => void>())
  const soundEnabledRef = useRef(isSoundEnabled)
  const voiceEnabledRef = useRef(isVoiceEnabled)

  useEffect(() => {
    soundEnabledRef.current = isSoundEnabled
  }, [isSoundEnabled])

  useEffect(() => {
    voiceEnabledRef.current = isVoiceEnabled
  }, [isVoiceEnabled])

  const triggerListRefresh = useCallback(() => {
    listRefreshListenersRef.current.forEach((listener) => {
      listener()
    })
  }, [])

  const subscribeListRefresh = useCallback((callback: () => void) => {
    listRefreshListenersRef.current.add(callback)
    return () => {
      listRefreshListenersRef.current.delete(callback)
    }
  }, [])

  const getSoundEnabled = useCallback(() => soundEnabledRef.current, [])
  const getVoiceEnabled = useCallback(() => voiceEnabledRef.current, [])

  useAdminInquiryRealtimeHub({
    enabled,
    onNotify,
    onSummaryChange: setSummary,
    triggerListRefresh,
    getSoundEnabled,
    getVoiceEnabled,
  })

  const value = useMemo(
    () => ({
      summary,
      unreadCount: summary.unreadCount,
      subscribeListRefresh,
    }),
    [subscribeListRefresh, summary],
  )

  return (
    <AdminInquiryRealtimeContext.Provider value={value}>
      {children}
    </AdminInquiryRealtimeContext.Provider>
  )
}

export function useAdminInquiryRealtime(): AdminInquiryRealtimeContextValue {
  const context = useContext(AdminInquiryRealtimeContext)

  if (!context) {
    throw new Error('useAdminInquiryRealtime must be used within AdminInquiryRealtimeProvider')
  }

  return context
}
