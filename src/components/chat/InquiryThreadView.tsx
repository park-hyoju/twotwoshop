import { useCallback, useEffect, useMemo, useState } from 'react'
import { getInquiryStatusLabel, getInquiryTypeLabel } from '../../lib/adminInquiryDisplay'
import { buildInquiryChatTimeline } from '../../lib/inquiryChatTimeline'
import { uploadInquiryImages } from '../../lib/inquiryImageUpload'
import { useCustomerThreadRefresh } from '../../hooks/useInquiryRealtime'
import {
  CustomerInquiryRepositoryError,
  addCustomerInquiryFollowUp,
  markCustomerInquiryAsRead,
} from '../../services/customerInquiryRepository'
import type { CustomerInquiryThread } from '../../types/customerInquiry'
import { CHAT_THREAD_CLASSNAME } from './chatMessengerStyles'
import { InquiryChatComposer } from './InquiryChatComposer'
import { InquiryChatTimeline } from './InquiryChatTimeline'
import { InquiryImageUploader } from './InquiryImageUploader'

interface InquiryThreadViewProps {
  thread: CustomerInquiryThread
  onBack: () => void
  onThreadUpdate: (thread: CustomerInquiryThread) => void
}

export function InquiryThreadView({ thread, onBack, onThreadUpdate }: InquiryThreadViewProps) {
  const [followUpMessage, setFollowUpMessage] = useState('')
  const [followUpImages, setFollowUpImages] = useState<File[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [showImagePicker, setShowImagePicker] = useState(false)

  const handleThreadRefresh = useCallback(
    (updated: CustomerInquiryThread) => {
      onThreadUpdate(updated)
    },
    [onThreadUpdate],
  )

  useCustomerThreadRefresh({
    inquiryId: thread.id,
    name: thread.name,
    phone: thread.phone,
    enabled: true,
    onThreadUpdate: handleThreadRefresh,
  })

  useEffect(() => {
    void markCustomerInquiryAsRead({
      inquiryId: thread.id,
      name: thread.name,
      phone: thread.phone,
    })
  }, [thread.id, thread.name, thread.phone])

  const timeline = useMemo(
    () =>
      buildInquiryChatTimeline({
        inquiryId: thread.id,
        initialMessage: thread.message,
        initialImageUrls: thread.image_urls,
        initialCreatedAt: thread.created_at,
        adminReply: thread.admin_reply,
        updatedAt: thread.updated_at,
        messages: thread.messages.map((message) => ({
          id: message.id,
          sender: message.sender,
          message: message.message,
          image_urls: message.image_urls,
          created_at: message.created_at,
        })),
      }),
    [thread],
  )

  async function handleSend() {
    setErrorMessage(null)

    if (!followUpMessage.trim()) {
      setErrorMessage('메시지를 입력해 주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const imageUrls =
        followUpImages.length > 0 ? await uploadInquiryImages(followUpImages) : []

      const updated = await addCustomerInquiryFollowUp({
        inquiryId: thread.id,
        name: thread.name,
        phone: thread.phone,
        message: followUpMessage,
        imageUrls,
      })

      if (!updated) {
        setErrorMessage('문의 정보를 찾을 수 없습니다.')
        return
      }

      setFollowUpMessage('')
      setFollowUpImages([])
      setShowImagePicker(false)
      onThreadUpdate(updated)
    } catch (error) {
      setErrorMessage(
        error instanceof CustomerInquiryRepositoryError
          ? error.message
          : error instanceof Error
            ? error.message
            : '메시지 전송 중 오류가 발생했습니다.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={CHAT_THREAD_CLASSNAME}>
      <div className="shrink-0 border-b border-neutral-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-800"
        >
          ← 홈으로
        </button>
        <p className="text-sm font-semibold text-neutral-900">
          {getInquiryTypeLabel(thread.type)} · {getInquiryStatusLabel(thread.status)}
        </p>
        {thread.order_reference && (
          <p className="mt-0.5 text-xs text-neutral-500">주문/상품: {thread.order_reference}</p>
        )}
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#f7f7f7] px-4 py-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <InquiryChatTimeline
          items={timeline}
          perspective="customer"
          onImageClick={setPreviewImageUrl}
        />
      </div>

      <div className="shrink-0 min-w-0 overflow-x-hidden">
        {showImagePicker && (
          <div className="border-t border-neutral-200 bg-white px-4 py-2">
            <InquiryImageUploader
              files={followUpImages}
              onChange={setFollowUpImages}
              disabled={isSubmitting}
            />
          </div>
        )}
        <InquiryChatComposer
          value={followUpMessage}
          onChange={setFollowUpMessage}
          onSend={() => void handleSend()}
          isSubmitting={isSubmitting}
          placeholder="메시지를 입력하세요"
          errorMessage={errorMessage}
          showAttachButton
          onAttachClick={() => setShowImagePicker((current) => !current)}
        />
      </div>

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImageUrl(null)}
          role="presentation"
        >
          <img
            src={previewImageUrl}
            alt="첨부 이미지 크게 보기"
            className="max-h-[90vh] max-w-full rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
