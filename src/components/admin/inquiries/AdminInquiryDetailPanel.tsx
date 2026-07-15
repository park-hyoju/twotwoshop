import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatDateTime } from '../../../lib/formatDateTime'
import { buildInquiryChatTimeline } from '../../../lib/inquiryChatTimeline'
import {
  INQUIRY_STATUS_OPTIONS,
  getInquiryDisplayCode,
  getInquiryTypeLabel,
  toInquiryStatusSelectValue,
} from '../../../lib/adminInquiryDisplay'
import {
  INQUIRY_REPLY_OVERWRITE_CONFIRM_MESSAGE,
  getInquiryReplyTemplate,
  type InquiryReplyTemplateKey,
} from '../../../lib/inquiryReplyTemplates'
import { maskPhoneNumber } from '../../../lib/maskPhone'
import { useAdminInquiryChatRealtime } from '../../../hooks/useInquiryRealtime'
import type { AdminInquiryRow, DbInquiryStatus } from '../../../types/adminInquiry'
import { InquiryChatComposer } from '../../chat/InquiryChatComposer'
import { InquiryChatTimeline } from '../../chat/InquiryChatTimeline'
import { InquiryReplyTemplateButtons } from './InquiryReplyTemplateButtons'
import { InquiryStatusBadge, InquiryTypeBadge } from './InquiryBadges'

interface AdminInquiryDetailPanelProps {
  inquiry: AdminInquiryRow
  isSubmitting: boolean
  errorMessage: string | null
  onSendMessage: (input: { message: string; status: DbInquiryStatus }) => void
  onUpdateMeta: (input: { status: DbInquiryStatus; adminNote: string }) => void
  onRefresh: () => void
  onDelete: () => void
  onBack?: () => void
}

export function AdminInquiryDetailPanel({
  inquiry,
  isSubmitting,
  errorMessage,
  onSendMessage,
  onUpdateMeta,
  onRefresh,
  onDelete,
  onBack,
}: AdminInquiryDetailPanelProps) {
  const [draftMessage, setDraftMessage] = useState('')
  const [status, setStatus] = useState<DbInquiryStatus>('pending')
  const [adminNote, setAdminNote] = useState('')
  const [replyStatus, setReplyStatus] = useState<DbInquiryStatus>('pending')
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<InquiryReplyTemplateKey | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const handleRealtimeRefresh = useCallback(() => {
    onRefresh()
  }, [onRefresh])

  useAdminInquiryChatRealtime({
    inquiryId: inquiry.id,
    enabled: true,
    onRefresh: handleRealtimeRefresh,
  })

  useEffect(() => {
    setStatus(inquiry.status)
    setAdminNote(inquiry.admin_note ?? '')
    setDraftMessage('')
    setSelectedTemplateKey(null)
    setReplyStatus(inquiry.status === 'answered' ? 'answered' : 'pending')
  }, [inquiry])

  const timeline = useMemo(() => {
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
    if (adminNote !== (inquiry.admin_note ?? '') || status !== inquiry.status) {
      onUpdateMeta({ status, adminNote })
    }
  }

  return (
    <div className="admin-animate-slide flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-neutral-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 lg:hidden"
                aria-label="목록으로"
              >
                ←
              </button>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold tracking-tight text-neutral-900">
                  {inquiry.customer_name}
                </h2>
                <InquiryTypeBadge type={inquiry.inquiry_type} />
                <InquiryStatusBadge status={inquiry.status} />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {getInquiryDisplayCode(inquiry)} · 접수 {formatDateTime(inquiry.created_at)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <select
              value={toInquiryStatusSelectValue(status)}
              onChange={(event) => handleStatusChange(event.target.value as DbInquiryStatus)}
              className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 outline-none transition-all focus:border-neutral-400 focus:shadow-sm"
            >
              {INQUIRY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-100"
            >
              삭제
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-h-0 flex-col border-neutral-100 xl:border-r">
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#fafbfc] px-4 py-4 [scrollbar-width:thin]">
            <InquiryChatTimeline
              items={timeline}
              perspective="admin"
              onImageClick={setPreviewImageUrl}
            />
          </div>

          <div className="shrink-0 border-t border-neutral-100 bg-white">
            <div className="border-b border-neutral-100 px-4 py-2.5">
              <InquiryReplyTemplateButtons
                selectedKey={selectedTemplateKey}
                onSelect={applyTemplate}
              />
            </div>
            <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2">
              <span className="text-xs font-medium text-neutral-500">전송 후 상태</span>
              <select
                value={toInquiryStatusSelectValue(replyStatus)}
                onChange={(event) => setReplyStatus(event.target.value as DbInquiryStatus)}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700 outline-none"
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
              placeholder="고객에게 보낼 답변을 입력하세요"
              errorMessage={errorMessage}
            />
          </div>
        </div>

        <details className="shrink-0 border-t border-neutral-100 bg-white p-4 xl:hidden">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            고객 정보 · 내부 메모
          </summary>
          <div className="mt-3 space-y-3 rounded-[20px] border border-neutral-100 bg-neutral-50/60 p-4">
            <InfoRow label="이름" value={inquiry.customer_name} />
            <InfoRow label="연락처" value={maskPhoneNumber(inquiry.customer_phone)} />
            <InfoRow label="이메일" value={inquiry.customer_email || '-'} />
            <InfoRow label="문의유형" value={getInquiryTypeLabel(inquiry.inquiry_type)} />
            <InfoRow label="주문번호" value={inquiry.order_reference || '-'} />
          </div>
          <textarea
            rows={4}
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            onBlur={handleNoteBlur}
            placeholder="고객에게 보이지 않는 내부 메모"
            className="mt-3 w-full resize-none rounded-[20px] border border-neutral-200 bg-white px-3 py-3 text-xs leading-5 text-neutral-800 outline-none transition-all focus:border-neutral-400 focus:shadow-sm"
          />
        </details>

        <aside className="hidden shrink-0 overflow-y-auto bg-white p-4 xl:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            고객 정보
          </p>
          <div className="mt-3 space-y-3 rounded-[20px] border border-neutral-100 bg-neutral-50/60 p-4">
            <InfoRow label="이름" value={inquiry.customer_name} />
            <InfoRow label="연락처" value={maskPhoneNumber(inquiry.customer_phone)} />
            <InfoRow label="이메일" value={inquiry.customer_email || '-'} />
            <InfoRow label="문의유형" value={getInquiryTypeLabel(inquiry.inquiry_type)} />
            <InfoRow label="주문번호" value={inquiry.order_reference || '-'} />
            <InfoRow label="최근 수정" value={formatDateTime(inquiry.updated_at)} />
          </div>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            내부 메모
          </p>
          <textarea
            rows={5}
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            onBlur={handleNoteBlur}
            placeholder="고객에게 보이지 않는 내부 메모"
            className="mt-2 w-full resize-none rounded-[20px] border border-neutral-200 bg-white px-3 py-3 text-xs leading-5 text-neutral-800 outline-none transition-all focus:border-neutral-400 focus:shadow-sm"
          />
        </aside>
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
            className="max-h-[90vh] max-w-full rounded-[24px] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-neutral-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-neutral-800">{value}</p>
    </div>
  )
}
