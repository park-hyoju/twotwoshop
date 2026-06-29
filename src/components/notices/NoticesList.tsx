import { Link } from 'react-router-dom'
import { formatNoticeDate } from '../../lib/formatNoticeDate'
import { ROUTES } from '../../lib/routes'
import type { StorefrontNotice } from '../../types/notice'

interface NoticeListItemProps {
  notice: StorefrontNotice
}

export function NoticeListItem({ notice }: NoticeListItemProps) {
  return (
    <li>
      <Link
        to={`${ROUTES.notices}/${notice.id}`}
        className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-4 transition hover:border-neutral-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {notice.isPinned && (
              <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
                상단 고정
              </span>
            )}
            <h2 className="truncate text-base font-semibold text-neutral-900 sm:text-lg">
              {notice.title}
            </h2>
          </div>
        </div>
        <time
          dateTime={notice.createdAt}
          className="shrink-0 text-sm text-neutral-500"
        >
          {formatNoticeDate(notice.createdAt)}
        </time>
      </Link>
    </li>
  )
}

interface NoticesListProps {
  notices: StorefrontNotice[]
}

export function NoticesList({ notices }: NoticesListProps) {
  const pinnedNotices = notices.filter((notice) => notice.isPinned)
  const regularNotices = notices.filter((notice) => !notice.isPinned)

  return (
    <div className="space-y-8">
      {pinnedNotices.length > 0 && (
        <section aria-label="상단 고정 공지">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">중요 공지</h2>
          <ul className="space-y-3">
            {pinnedNotices.map((notice) => (
              <NoticeListItem key={notice.id} notice={notice} />
            ))}
          </ul>
        </section>
      )}

      {regularNotices.length > 0 && (
        <section aria-label="공지사항 목록">
          {pinnedNotices.length > 0 && (
            <h2 className="mb-3 text-sm font-semibold text-neutral-700">전체 공지</h2>
          )}
          <ul className="space-y-3">
            {regularNotices.map((notice) => (
              <NoticeListItem key={notice.id} notice={notice} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
