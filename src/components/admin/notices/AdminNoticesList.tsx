import { formatNoticeDate } from '../../../lib/formatNoticeDate'
import type { NoticeRow } from '../../../types/notice'

interface AdminNoticesListProps {
  notices: NoticeRow[]
  actionId: string | null
  onEdit: (notice: NoticeRow) => void
  onDelete: (noticeId: string) => void
  onToggleActive: (noticeId: string, isActive: boolean) => void
  onTogglePinned: (noticeId: string, isPinned: boolean) => void
}

export function AdminNoticesList({
  notices,
  actionId,
  onEdit,
  onDelete,
  onToggleActive,
  onTogglePinned,
}: AdminNoticesListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="hidden border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-600 sm:grid sm:grid-cols-[1fr_120px_100px_100px_220px] sm:gap-4">
        <span>제목</span>
        <span>등록일</span>
        <span>고정</span>
        <span>노출</span>
        <span className="text-right">관리</span>
      </div>

      <ul className="divide-y divide-neutral-200">
        {notices.map((notice) => {
          const isBusy = actionId === notice.id

          return (
            <li
              key={notice.id}
              className="px-4 py-4 sm:grid sm:grid-cols-[1fr_120px_100px_100px_220px] sm:items-center sm:gap-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-neutral-900">{notice.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600 sm:hidden">
                  {notice.content}
                </p>
                <p className="mt-1 text-xs text-neutral-500 sm:hidden">
                  {formatNoticeDate(notice.created_at)}
                </p>
              </div>

              <time
                dateTime={notice.created_at}
                className="hidden text-sm text-neutral-500 sm:block"
              >
                {formatNoticeDate(notice.created_at)}
              </time>

              <div className="mt-3 sm:mt-0">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    notice.is_pinned
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {notice.is_pinned ? '고정' : '일반'}
                </span>
              </div>

              <div className="mt-2 sm:mt-0">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    notice.is_active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {notice.is_active ? 'ON' : 'OFF'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
                <button
                  type="button"
                  onClick={() => onTogglePinned(notice.id, !notice.is_pinned)}
                  disabled={isBusy}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {notice.is_pinned ? '고정 해제' : '상단 고정'}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleActive(notice.id, !notice.is_active)}
                  disabled={isBusy}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {notice.is_active ? '비노출' : '노출'}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(notice)}
                  disabled={isBusy}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(notice.id)}
                  disabled={isBusy}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
