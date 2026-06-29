import { useCallback, useEffect, useState } from 'react'
import { AdminRestockNotificationsList } from '../../components/admin/restock/AdminRestockNotificationsList'
import {
  AdminRestockNotificationRepositoryError,
  fetchAdminRestockNotifications,
  markRestockNotificationSent,
} from '../../services/adminRestockNotificationRepository'
import type { AdminRestockNotificationRow } from '../../types/restockNotification'

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminRestockNotificationRepositoryError) {
    return error.message
  }

  return '재입고 알림 목록을 불러오지 못했습니다.'
}

export function AdminRestockNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminRestockNotificationRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const rows = await fetchAdminRestockNotifications()
      setNotifications(rows)
    } catch (error) {
      setNotifications([])
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  async function handleMarkSent(notificationId: string) {
    setActionId(notificationId)

    try {
      await markRestockNotificationSent(notificationId)
      await loadNotifications()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  const pendingCount = notifications.filter((item) => !item.is_notified).length

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">재입고 알림</h1>
        <p className="mt-2 text-base text-neutral-600 sm:text-lg">
          고객 재입고 알림 신청 내역을 확인합니다. 실제 카카오/SMS 발송은 추후 연동됩니다.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">전체 신청</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{notifications.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">발송 대기</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">발송 완료</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {notifications.length - pendingCount}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
            재입고 알림 목록을 불러오는 중입니다...
          </div>
        )}

        {!isLoading && errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700"
          >
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadNotifications()}
              className="mt-4 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && notifications.length === 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
            아직 재입고 알림 신청이 없습니다.
          </div>
        )}

        {!isLoading && !errorMessage && notifications.length > 0 && (
          <AdminRestockNotificationsList
            notifications={notifications}
            actionId={actionId}
            onMarkSent={(id) => void handleMarkSent(id)}
          />
        )}
      </div>
    </div>
  )
}
