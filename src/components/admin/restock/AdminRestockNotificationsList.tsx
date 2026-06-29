import { formatDateTime } from '../../../lib/formatDateTime'
import { maskPhoneNumber } from '../../../lib/maskPhone'
import type { AdminRestockNotificationRow } from '../../../types/restockNotification'

interface AdminRestockNotificationsListProps {
  notifications: AdminRestockNotificationRow[]
  actionId: string | null
  onMarkSent: (notificationId: string) => void
}

function MemberTypeBadge({ userId }: { userId: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        userId
          ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
          : 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200'
      }`}
    >
      {userId ? '회원' : '비회원'}
    </span>
  )
}

export function AdminRestockNotificationsList({
  notifications,
  actionId,
  onMarkSent,
}: AdminRestockNotificationsListProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">상품</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">신청자</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">연락처</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">이메일</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">구분</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">신청일</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">상태</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {notifications.map((notification) => (
            <tr key={notification.id} className="text-sm text-neutral-800">
              <td className="px-4 py-3">
                <p className="font-medium text-neutral-900">{notification.product_name}</p>
                <p className="mt-1 text-xs text-neutral-500">{notification.product_slug}</p>
              </td>
              <td className="px-4 py-3">{notification.customer_name ?? '-'}</td>
              <td className="px-4 py-3">
                {notification.phone ? maskPhoneNumber(notification.phone) : '-'}
              </td>
              <td className="px-4 py-3">{notification.email ?? '-'}</td>
              <td className="px-4 py-3">
                <MemberTypeBadge userId={notification.user_id} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatDateTime(notification.created_at)}
              </td>
              <td className="px-4 py-3">
                {notification.is_notified ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    발송 완료
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    대기
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {!notification.is_notified && (
                  <button
                    type="button"
                    disabled={actionId === notification.id}
                    onClick={() => onMarkSent(notification.id)}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 sm:text-sm"
                  >
                    발송 완료 처리
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
