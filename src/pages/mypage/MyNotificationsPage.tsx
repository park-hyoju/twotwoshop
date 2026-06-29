import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { MyPageEmptyState } from '../../components/mypage/MyPageEmptyState'
import { MyPageShell } from '../../components/mypage/MyPageShell'
import { formatDateTime } from '../../lib/formatDateTime'
import {
  fetchMypageNotifications,
  markNoticeNotificationRead,
} from '../../services/mypageNotificationService'
import type { MypageNotificationItem } from '../../types/mypage'

const KIND_LABELS = {
  restock: '재입고',
  inquiry: '문의 답변',
  notice: '공지',
} as const

export function MyNotificationsPage() {
  const [notifications, setNotifications] = useState<MypageNotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadNotifications() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const nextNotifications = await fetchMypageNotifications()
        if (!cancelled) {
          setNotifications(nextNotifications)
        }
      } catch {
        if (!cancelled) {
          setErrorMessage('알림을 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadNotifications()

    return () => {
      cancelled = true
    }
  }, [])

  function handleNoticeClick(notification: MypageNotificationItem) {
    if (notification.kind !== 'notice') {
      return
    }

    const noticeId = notification.id.replace(/^notice-/, '')
    markNoticeNotificationRead(noticeId)
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, isUnread: false } : item,
      ),
    )
  }

  return (
    <MyPageShell title="알림센터" description="재입고, 문의 답변, 공지 알림을 확인할 수 있습니다.">
      {isLoading ? (
        <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-500 shadow-sm">
          알림을 불러오는 중...
        </p>
      ) : errorMessage ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : notifications.length === 0 ? (
        <MyPageEmptyState
          title="새 알림이 없습니다"
          description="재입고 알림, 문의 답변, 공지사항이 등록되면 이곳에서 확인할 수 있습니다."
          icon={<Bell className="h-6 w-6" aria-hidden />}
        />
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Link
                to={notification.href}
                onClick={() => handleNoticeClick(notification)}
                className={`block rounded-2xl border bg-white p-5 shadow-sm transition-colors hover:border-neutral-300 sm:p-6 ${
                  notification.isUnread ? 'border-neutral-900' : 'border-neutral-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-500">
                      {KIND_LABELS[notification.kind]}
                    </p>
                    <p className="mt-1 text-base font-semibold text-neutral-900">{notification.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{notification.message}</p>
                    <p className="mt-2 text-xs text-neutral-400">{formatDateTime(notification.createdAt)}</p>
                  </div>
                  {notification.isUnread ? (
                    <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white">
                      NEW
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </MyPageShell>
  )
}
