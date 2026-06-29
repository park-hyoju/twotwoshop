import type { ChatInquiryQuickKey } from '../../lib/chatInquiryTypes'
import type { ConsultationStatus } from '../../types/consultationStatus'
import type { CustomerInquiryThread } from '../../types/customerInquiry'
import { ChatComposeView } from './ChatComposeView'
import { ChatMessengerLayout } from './ChatMessengerLayout'
import { ChatQuickReplyList } from './ChatQuickReplyList'
import { InquiryLookupForm } from './InquiryLookupForm'
import { InquirySuccessView } from './InquirySuccessView'
import { InquiryThreadView } from './InquiryThreadView'
import { CHAT_BODY_CLASSNAME, CHAT_THREAD_CLASSNAME, CHAT_WINDOW_CLASSNAME } from './chatMessengerStyles'

export type ChatWindowView = 'home' | 'compose' | 'success' | 'lookup' | 'thread'

interface ChatWindowProps {
  view: ChatWindowView
  selectedQuickKey: ChatInquiryQuickKey | null
  showSuccess: boolean
  activeThread: CustomerInquiryThread | null
  consultationStatus: ConsultationStatus
  onClose: () => void
  onSelectQuickInquiry: (key: ChatInquiryQuickKey) => void
  onOpenLookup: () => void
  onBackToHome: () => void
  onSubmitSuccess: () => void
  onThreadFound: (thread: CustomerInquiryThread) => void
  onThreadUpdate: (thread: CustomerInquiryThread) => void
}

function ChatHomeView({
  onSelectQuickInquiry,
  onOpenLookup,
}: {
  onSelectQuickInquiry: (key: ChatInquiryQuickKey) => void
  onOpenLookup: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <ChatQuickReplyList onSelect={onSelectQuickInquiry} />

      <button
        type="button"
        onClick={onOpenLookup}
        className="py-1 text-center text-[13px] font-medium text-neutral-500 underline decoration-neutral-300 underline-offset-4 transition-colors duration-200 hover:text-neutral-700"
      >
        내 문의 확인하기
      </button>
    </div>
  )
}

export function ChatWindow({
  view,
  selectedQuickKey,
  showSuccess,
  activeThread,
  consultationStatus,
  onClose,
  onSelectQuickInquiry,
  onOpenLookup,
  onBackToHome,
  onSubmitSuccess,
  onThreadFound,
  onThreadUpdate,
}: ChatWindowProps) {
  const isCompose = view === 'compose'

  return (
    <div
      className={`${CHAT_WINDOW_CLASSNAME} flex flex-col`}
      role="dialog"
      aria-label="사이트 채팅 상담"
    >
      <ChatMessengerLayout
        onClose={onClose}
        scrollable={!isCompose && view !== 'thread'}
        consultationStatus={consultationStatus}
      >
        <div
          className={
            view === 'thread' || view === 'compose' ? CHAT_THREAD_CLASSNAME : CHAT_BODY_CLASSNAME
          }
        >
          {view === 'home' && (
            <ChatHomeView
              onSelectQuickInquiry={onSelectQuickInquiry}
              onOpenLookup={onOpenLookup}
            />
          )}

          {view === 'compose' && selectedQuickKey && (
            <ChatComposeView
              quickKey={selectedQuickKey}
              onBack={onBackToHome}
              onSuccess={onSubmitSuccess}
            />
          )}

          {view === 'success' && showSuccess && (
            <InquirySuccessView
              onLookup={onOpenLookup}
              onClose={onClose}
              consultationStatus={consultationStatus}
            />
          )}

          {view === 'lookup' && (
            <InquiryLookupForm onBack={onBackToHome} onFound={onThreadFound} />
          )}

          {view === 'thread' && activeThread && (
            <InquiryThreadView
              thread={activeThread}
              onBack={onBackToHome}
              onThreadUpdate={onThreadUpdate}
            />
          )}
        </div>
      </ChatMessengerLayout>
    </div>
  )
}
