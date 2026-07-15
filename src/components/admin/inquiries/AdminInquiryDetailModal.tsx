import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatDateTime } from '../../../lib/formatDateTime'
import { buildInquiryChatTimeline } from '../../../lib/inquiryChatTimeline'
import { INQUIRY_STATUS_OPTIONS, getInquiryDisplayCode, toInquiryStatusSelectValue } from '../../../lib/adminInquiryDisplay'
import { INQUIRY_REPLY_OVERWRITE_CONFIRM_MESSAGE, getInquiryReplyTemplate, type InquiryReplyTemplateKey } from '../../../lib/inquiryReplyTemplates'
import { useAdminInquiryChatRealtime } from '../../../hooks/useInquiryRealtime'
import type { AdminInquiryRow, DbInquiryStatus } from '../../../types/adminInquiry'
import { InquiryChatComposer } from '../../chat/InquiryChatComposer'
import { InquiryChatTimeline } from '../../chat/InquiryChatTimeline'
import { InquiryReplyTemplateButtons } from './InquiryReplyTemplateButtons'
import { InquiryStatusBadge, InquiryTypeBadge } from './InquiryBadges'

interface AdminInquiryDetailModalProps {
  inquiry: AdminInquiryRow | null
  isOpen: boolean
  isSubmitting: boolean
  errorMessage: string | null
  onClose: () => void
  onSendMessage: (input: { message: string; status: DbInquiryStatus }) => void
  onUpdateMeta: (input: { status: DbInquiryStatus; adminNote: string }) => void
  onRefresh: () => void
}

export function AdminInquiryDetailModal({
  inquiry,
  isOpen,
  isSubmitting,
  errorMessage,
  onClose,
  onSendMessage,
  onUpdateMeta,
  onRefresh,
}: AdminInquiryDetailModalProps) {
  const [draftMessage, setDraftMessage] = useState('')
  const [status, setStatus] = useState<DbInquiryStatus>('pending')
  const [adminNote, setAdminNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [replyStatus, setReplyStatus] = useState<DbInquiryStatus>('pending')
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<InquiryReplyTemplateKey | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const handleRealtimeRefresh = useCallback(() => {
    onRefresh()
  }, [onRefresh])

  useAdminInquiryChatRealtime({
    inquiryId: inquiry?.id ?? null,
    enabled: isOpen,
    onRefresh: handleRealtimeRefresh,
  })

  useEffect(() => {
    if (!isOpen || !inquiry) {
      return
    }

    setStatus(inquiry.status)
    setAdminNote(inquiry.admin_note ?? '')
    setDraftMessage('')
    setSelectedTemplateKey(null)
    setReplyStatus(inquiry.status === 'answered' ? 'answered' : 'pending')
  }, [inquiry, isOpen])

  const timeline = useMemo(() => {
    if (!inquiry) {
      return []
    }

    return buildInquiryChatTimeline({
      inquiryId: inquiry.id,
      initialMessage: inquiry.message,
      initialImageUrls: inquiry.image_urls,
      initialCreatedAt: inquiry.created_at,
      adminReply: inquiry.admin_reply,
      updatedAt: inquiry.updated_at,
      messages: (inquiry.messages ?? []).map((message) => ({
        id: message.id,
        sender: message.sender,
        message: message.message,
        image_urls: message.image_urls,
        created_at: message.created_at,
      })),
    })
  }, [inquiry])

  if (!isOpen || !inquiry) {
    return null
  }

  function handleSend() {
    const trimmed = draftMessage.trim()
    if (!trimmed) {
      return
    }

    onSendMessage({ message: trimmed, status: replyStatus })
    setDraftMessage('')
    setSelectedTemplateKey(null)
  }

  function applyTemplate(templateKey: InquiryReplyTemplateKey) {
    const content = getInquiryReplyTemplate(templateKey).content

    if (draftMessage.trim().length > 0) {
      const confirmed = window.confirm(INQUIRY_REPLY_OVERWRITE_CONFIRM_MESSAGE)
      if (!confirmed) {
        return
      }
    }

    setDraftMessage(content)
    setSelectedTemplateKey(templateKey)
  }

  function handleStatusChange(nextStatus: DbInquiryStatus) {
    setStatus(nextStatus)
    onUpdateMeta({ status: nextStatus, adminNote })
  }

  function handleNoteBlur() {
    if (!inquiry) {
      return
    }

    if (adminNote !== (inquiry.admin_note ?? '') || status !== inquiry.status) {
      onUpdateMeta({ status, adminNote })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-inquiry-detail-title"
        className="flex h-[min(720px,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-2xl"
      >
        <header className="shrink-0 border-b border-neutral-200 bg-white px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="admin-inquiry-detail-title" className="truncate text-base font-bold text-neutral-900">
                {inquiry.customer_name}
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {getInquiryDisplayCode(inquiry)} · {inquiry.customer_phone}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">
                접수 {formatDateTime(inquiry.created_at)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <InquiryTypeBadge type={inquiry.inquiry_type} />
            <InquiryStatusBadge status={inquiry.status} />
            <select
              value={toInquiryStatusSelectValue(status)}
              onChange={(event) => handleStatusChange(event.target.value as DbInquiryStatus)}
              className="ml-auto rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 outline-none"
            >
              {INQUIRY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNote((current) => !current)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              내부 메모
            </button>
          </div>

          {showNote && (
            <textarea
              rows={2}
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              onBlur={handleNoteBlur}
              placeholder="내부 참고용 메모 (고객 비노출)"
              className="mt-3 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-800 outline-none focus:border-neutral-400"
            />
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <InquiryChatTimeline
            items={timeline}
            perspective="admin"
            onImageClick={setPreviewImageUrl}
          />
        </div>

        <div className="shrink-0 border-t border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 px-3 py-2">
            <InquiryReplyTemplateButtons
              selectedKey={selectedTemplateKey}
              onSelect={applyTemplate}
            />
          </div>
          <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
            <span className="text-xs text-neutral-500">전송 후 상태</span>
            <select
              value={toInquiryStatusSelectValue(replyStatus)}
              onChange={(event) => setReplyStatus(event.target.value as DbInquiryStatus)}
              className="rounded-full border border-neutral-200 bg-[#f7f7f7] px-2.5 py-1 text-xs font-medium text-neutral-700 outline-none"
            >
              <option value="pending">답변 대기</option>
              <option value="answered">답변 완료</option>
            </select>
          </div>
          <InquiryChatComposer
            value={draftMessage}
            onChange={setDraftMessage}
            onSend={handleSend}
            isSubmitting={isSubmitting}
            placeholder="답변을 입력하세요"
            errorMessage={errorMessage}
          />
        </div>
      </div>

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
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
