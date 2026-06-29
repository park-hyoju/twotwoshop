import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { DEFAULT_CONSULTATION_STATUS } from '../lib/consultationStatusDisplay'
import {
  ConsultationStatusRepositoryError,
  fetchConsultationStatus,
  updateConsultationStatus,
} from '../services/consultationStatusRepository'
import type { ConsultationStatus, ConsultationStatusSettings } from '../types/consultationStatus'

interface UseConsultationStatusOptions {
  enabled?: boolean
}

export function useConsultationStatus(options: UseConsultationStatusOptions = {}) {
  const { enabled = true } = options
  const [settings, setSettings] = useState<ConsultationStatusSettings>({
    status: DEFAULT_CONSULTATION_STATUS,
    updatedAt: new Date().toISOString(),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const refresh = useCallback(async () => {
    if (!enabled) {
      return
    }

    try {
      const next = await fetchConsultationStatus()
      setSettings(next)
    } catch {
      // Keep last known status on transient failures.
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    void refresh()
  }, [enabled, refresh])

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured || !supabase) {
      return
    }

    const channel = supabase
      .channel('consultation-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_status_settings',
          filter: 'id=eq.default',
        },
        () => {
          void refresh()
        },
      )
      .subscribe()

    return () => {
      void supabase!.removeChannel(channel)
    }
  }, [enabled, refresh])

  const saveStatus = useCallback(
    async (status: ConsultationStatus) => {
      setIsSaving(true)

      try {
        const next = await updateConsultationStatus(status)
        setSettings(next)
        return next
      } catch (error) {
        if (error instanceof ConsultationStatusRepositoryError) {
          throw error
        }

        throw new ConsultationStatusRepositoryError('상담 상태를 저장하지 못했습니다.')
      } finally {
        setIsSaving(false)
      }
    },
    [],
  )

  return {
    status: settings.status,
    updatedAt: settings.updatedAt,
    isLoading,
    isSaving,
    refresh,
    saveStatus,
  }
}
