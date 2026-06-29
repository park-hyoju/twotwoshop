import { useEffect, useState } from 'react'
import { useConsultationStatus } from '../../hooks/useConsultationStatus'
import { CHAT_WIDGET_OPEN_EVENT } from '../../lib/chatWidgetBridge'
import type { ChatInquiryQuickKey } from '../../lib/chatInquiryTypes'
import type { CustomerInquiryThread } from '../../types/customerInquiry'
import { ChatButton } from './ChatButton'
import { ChatWindow, type ChatWindowView } from './ChatWindow'

export function ChatWidget() {
  const { status: consultationStatus } = useConsultationStatus()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<ChatWindowView>('home')
  const [selectedQuickKey, setSelectedQuickKey] = useState<ChatInquiryQuickKey | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeThread, setActiveThread] = useState<CustomerInquiryThread | null>(null)

  function resetChatState() {
    setView('home')
    setSelectedQuickKey(null)
    setShowSuccess(false)
    setActiveThread(null)
  }

  function handleClose() {
    setIsOpen(false)
    resetChatState()
  }

  function handleSelectQuickInquiry(key: ChatInquiryQuickKey) {
    setSelectedQuickKey(key)
    setView('compose')
  }

  function handleBackToHome() {
    setView('home')
    setActiveThread(null)
    setSelectedQuickKey(null)
  }

  function handleSubmitSuccess() {
    setShowSuccess(true)
    setView('success')
  }

  function handleOpenLookup() {
    setView('lookup')
  }

  useEffect(() => {
    function handleOpenRequest() {
      setIsOpen(true)
    }

    window.addEventListener(CHAT_WIDGET_OPEN_EVENT, handleOpenRequest)
    return () => window.removeEventListener(CHAT_WIDGET_OPEN_EVENT, handleOpenRequest)
  }, [])

  function handleThreadFound(thread: CustomerInquiryThread) {
    setActiveThread(thread)
    setView('thread')
  }

  return (
    <div className="fixed bottom-5 right-3 z-[60] flex flex-col items-end sm:bottom-6 sm:right-6">
      {isOpen && (
        <div className="mb-3 sm:mb-4">
          <ChatWindow
            view={view}
            selectedQuickKey={selectedQuickKey}
            showSuccess={showSuccess}
            activeThread={activeThread}
            consultationStatus={consultationStatus}
            onClose={handleClose}
            onSelectQuickInquiry={handleSelectQuickInquiry}
            onOpenLookup={handleOpenLookup}
            onBackToHome={handleBackToHome}
            onSubmitSuccess={handleSubmitSuccess}
            onThreadFound={handleThreadFound}
            onThreadUpdate={setActiveThread}
          />
        </div>
      )}
      {!isOpen && <ChatButton isOpen={isOpen} onClick={() => setIsOpen(true)} />}
    </div>
  )
}
