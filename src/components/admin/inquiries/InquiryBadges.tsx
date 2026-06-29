import type { DbInquiryStatus, DbInquiryType } from '../../../types/adminInquiry'
import {
  INQUIRY_STATUS_BADGE_CLASSES,
  INQUIRY_TYPE_BADGE_CLASSES,
  getInquiryStatusLabel,
  getInquiryTypeLabel,
} from '../../../lib/adminInquiryDisplay'

const badgeBaseClassName =
  'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset shadow-sm'

export function InquiryTypeBadge({ type }: { type: DbInquiryType }) {
  return (
    <span className={`${badgeBaseClassName} ${INQUIRY_TYPE_BADGE_CLASSES[type]}`}>
      {getInquiryTypeLabel(type)}
    </span>
  )
}

export function InquiryStatusBadge({ status }: { status: DbInquiryStatus }) {
  return (
    <span className={`${badgeBaseClassName} ${INQUIRY_STATUS_BADGE_CLASSES[status]}`}>
      {getInquiryStatusLabel(status)}
    </span>
  )
}
