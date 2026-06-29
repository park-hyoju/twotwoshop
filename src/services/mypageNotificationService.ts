import { noticeRepository } from './noticeRepository'
import { fetchMemberInquiries } from './memberInquiryRepository'
import { fetchMemberRestockNotifications } from './memberRestockRepository'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { MypageNotificationItem, MypageStats } from '../types/mypage'
import { ROUTES } from '../lib/routes'

const NOTICE_READ_STORAGE_KEY = 'twotwoshop:mypage-notice-read'

function readNoticeReadIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set()
  }

  try {
    const raw = window.localStorage.getItem(NOTICE_READ_STORAGE_KEY)
    if (!raw) {
      return new Set()
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return new Set()
    }

    return new Set(parsed.filter((item): item is string => typeof item === 'string'))
  } catch {
    return new Set()
  }
}

export function markNoticeNotificationRead(noticeId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const ids = readNoticeReadIds()
  ids.add(noticeId)
  window.localStorage.setItem(NOTICE_READ_STORAGE_KEY, JSON.stringify([...ids]))
}

export async function fetchMypageStats(): Promise<MypageStats> {
  const fallback: MypageStats = {
    orderCount: 0,
    inquiryCount: 0,
    addressCount: 0,
    notificationCount: 0,
  }

  if (!isSupabaseConfigured || !supabase) {
    return fallback
  }

  const { data, error } = await supabase.rpc('get_mypage_stats')

  if (error || !data || typeof data !== 'object') {
    return fallback
  }

  const row = data as Record<string, unknown>

  return {
    orderCount: typeof row.order_count === 'number' ? row.order_count : 0,
    inquiryCount: typeof row.inquiry_count === 'number' ? row.inquiry_count : 0,
    addressCount: typeof row.address_count === 'number' ? row.address_count : 0,
    notificationCount: typeof row.notification_count === 'number' ? row.notification_count : 0,
  }
}

export async function fetchMypageNotifications(): Promise<MypageNotificationItem[]> {
  const [restocks, inquiries, notices] = await Promise.all([
    fetchMemberRestockNotifications().catch(() => []),
    fetchMemberInquiries().catch(() => []),
    noticeRepository.findActiveNotices().catch(() => []),
  ])

  const readNoticeIds = readNoticeReadIds()
  const notifications: MypageNotificationItem[] = []

  for (const restock of restocks) {
    if (!restock.isNotified) {
      continue
    }

    notifications.push({
      id: `restock-${restock.id}`,
      kind: 'restock',
      title: '재입고 알림',
      message: `${restock.productName} 상품이 재입고되었습니다.`,
      createdAt: restock.notifiedAt ?? restock.createdAt,
      href: restock.productSlug ? `/products/${restock.productSlug}` : ROUTES.products,
      isUnread: true,
    })
  }

  for (const inquiry of inquiries) {
    if (!inquiry.hasUnreadReply) {
      continue
    }

    notifications.push({
      id: `inquiry-${inquiry.id}`,
      kind: 'inquiry',
      title: '문의 답변',
      message: inquiry.adminReply?.trim() || '문의에 대한 답변이 등록되었습니다.',
      createdAt: inquiry.updatedAt,
      href: `${ROUTES.mypageInquiries}/${inquiry.id}`,
      isUnread: true,
    })
  }

  for (const notice of notices.slice(0, 10)) {
    notifications.push({
      id: `notice-${notice.id}`,
      kind: 'notice',
      title: '공지사항',
      message: notice.title,
      createdAt: notice.createdAt,
      href: `${ROUTES.notices}/${notice.id}`,
      isUnread: !readNoticeIds.has(notice.id),
    })
  }

  return notifications.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}
