import type { AdminInquiryRow } from '../types/adminInquiry'

export function getAdminUnreadCount(inquiry: AdminInquiryRow): number {
  if (typeof inquiry.admin_unread_count === 'number' && inquiry.admin_unread_count > 0) {
    return inquiry.admin_unread_count
  }

  if (inquiry.has_unread_for_admin) {
    return 1
  }

  return 0
}

export function hasAdminUnreadMessages(inquiry: AdminInquiryRow): boolean {
  return getAdminUnreadCount(inquiry) > 0
}
