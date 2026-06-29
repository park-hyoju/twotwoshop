import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageTopActions } from '../../components/common/PageTopActions'
import { NoticesList } from '../../components/notices/NoticesList'
import { formatNoticeDate } from '../../lib/formatNoticeDate'
import { ROUTES } from '../../lib/routes'
import { noticeRepository } from '../../services/noticeRepository'
import type { StorefrontNotice } from '../../types/notice'

export function NoticesListPage() {
  const [notices, setNotices] = useState<StorefrontNotice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    void noticeRepository
      .findActiveNotices()
      .then((rows) => {
        if (!cancelled) {
          setNotices(rows)
          setErrorMessage(null)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotices([])
          setErrorMessage('공지사항을 불러오지 못했습니다.')
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <PageTopActions />

      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          NOTICE
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          공지사항
        </h1>
        <p className="mt-4 text-base text-neutral-600 sm:text-lg">
          투투샵의 새로운 소식과 안내를 확인하세요.
        </p>
      </header>

      {isLoading && (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
          공지사항을 불러오는 중입니다...
        </div>
      )}

      {!isLoading && errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && notices.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
          등록된 공지사항이 없습니다.
        </div>
      )}

      {!isLoading && !errorMessage && notices.length > 0 && <NoticesList notices={notices} />}
    </div>
  )
}

export function NoticeDetailPage() {
  const { id: noticeId = '' } = useParams()
  const [notice, setNotice] = useState<StorefrontNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setNotFound(false)

    void noticeRepository
      .findActiveNoticeById(noticeId)
      .then((row) => {
        if (!cancelled) {
          if (!row) {
            setNotice(null)
            setNotFound(true)
          } else {
            setNotice(row)
          }
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotice(null)
          setNotFound(true)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [noticeId])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <PageTopActions />
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
          공지사항을 불러오는 중입니다...
        </div>
      </div>
    )
  }

  if (notFound || !notice) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <PageTopActions />
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
          <p className="text-neutral-700">공지사항을 찾을 수 없습니다.</p>
          <Link
            to={ROUTES.notices}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white"
          >
            목록으로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <PageTopActions />

      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {notice.isPinned && (
            <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
              상단 고정
            </span>
          )}
          <time dateTime={notice.createdAt} className="text-sm text-neutral-500">
            {formatNoticeDate(notice.createdAt)}
          </time>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          {notice.title}
        </h1>
      </header>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="whitespace-pre-wrap text-base leading-relaxed text-neutral-700">
          {notice.content}
        </div>
      </div>
    </article>
  )
}
