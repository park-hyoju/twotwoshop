import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { requestAdminNotificationPermission } from '../lib/adminInquiryNotification'
import {
  disableAdminNotificationSound,
  disableAdminNotificationVoice,
  enableAdminNotificationSound,
  enableAdminNotificationVoice,
  isAdminNotificationSoundEnabled,
  isAdminNotificationVoiceEnabled,
  testNotificationSound,
  testNotificationVoice,
} from '../lib/adminInquiryNotificationSound'
import { isInquiryNotificationVoiceSupported } from '../lib/adminInquiryNotificationVoice'

interface AdminInquirySoundContextValue {
  isSoundEnabled: boolean
  isVoiceEnabled: boolean
  isVoiceSupported: boolean
  isBusy: boolean
  enableSound: () => Promise<boolean>
  disableSound: () => void
  testSound: () => Promise<void>
  enableVoice: () => void
  disableVoice: () => void
  testVoice: () => Promise<void>
}

const AdminInquirySoundContext = createContext<AdminInquirySoundContextValue | null>(null)

export function AdminInquirySoundProvider({ children }: { children: ReactNode }) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => isAdminNotificationSoundEnabled())
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => isAdminNotificationVoiceEnabled())
  const [isBusy, setIsBusy] = useState(false)
  const isVoiceSupported = isInquiryNotificationVoiceSupported()

  useEffect(() => {
    setIsSoundEnabled(isAdminNotificationSoundEnabled())
    setIsVoiceEnabled(isAdminNotificationVoiceEnabled())
  }, [])

  const enableSound = useCallback(async () => {
    if (isBusy) {
      return false
    }

    setIsBusy(true)

    try {
      requestAdminNotificationPermission()
      setIsSoundEnabled(true)
      const enabled = await enableAdminNotificationSound()
      setIsSoundEnabled(isAdminNotificationSoundEnabled())
      return enabled
    } finally {
      setIsBusy(false)
    }
  }, [isBusy])

  const disableSound = useCallback(() => {
    disableAdminNotificationSound()
    setIsSoundEnabled(false)
  }, [])

  const testSound = useCallback(async () => {
    if (isBusy) {
      return
    }

    setIsBusy(true)

    try {
      await testNotificationSound()
    } finally {
      setIsBusy(false)
    }
  }, [isBusy])

  const enableVoice = useCallback(() => {
    enableAdminNotificationVoice()
    setIsVoiceEnabled(isAdminNotificationVoiceEnabled())
  }, [])

  const disableVoice = useCallback(() => {
    disableAdminNotificationVoice()
    setIsVoiceEnabled(false)
  }, [])

  const testVoice = useCallback(async () => {
    if (isBusy) {
      return
    }

    setIsBusy(true)

    try {
      await testNotificationVoice()
    } finally {
      setIsBusy(false)
    }
  }, [isBusy])

  const value = useMemo(
    () => ({
      isSoundEnabled,
      isVoiceEnabled,
      isVoiceSupported,
      isBusy,
      enableSound,
      disableSound,
      testSound,
      enableVoice,
      disableVoice,
      testVoice,
    }),
    [
      disableSound,
      disableVoice,
      enableSound,
      enableVoice,
      isBusy,
      isSoundEnabled,
      isVoiceEnabled,
      isVoiceSupported,
      testSound,
      testVoice,
    ],
  )

  return (
    <AdminInquirySoundContext.Provider value={value}>{children}</AdminInquirySoundContext.Provider>
  )
}

export function useAdminInquirySound(): AdminInquirySoundContextValue {
  const context = useContext(AdminInquirySoundContext)

  if (!context) {
    throw new Error('useAdminInquirySound must be used within AdminInquirySoundProvider')
  }

  return context
}
