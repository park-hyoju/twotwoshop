import { useMemo, useState } from 'react'
import {
  formatDashboardDateLabel,
  formatDashboardMonthLabel,
  getCalendarMonthCells,
  getDayActivity,
  toLocalDateKey,
} from '../../../lib/adminDashboardCalendar'
import { formatPrice } from '../../../lib/formatPrice'
import type { AdminDashboardDayActivity } from '../../../types/adminDashboard'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface DashboardSalesCalendarProps {
  dailyActivity: AdminDashboardDayActivity[]
}

function hasDayActivity(activity: AdminDashboardDayActivity): boolean {
  return activity.revenue > 0 || activity.orderCount > 0
}

export function DashboardSalesCalendar({ dailyActivity }: DashboardSalesCalendarProps) {
  const today = new Date()
  const todayKey = toLocalDateKey(today)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const dailyActivityMap = useMemo(() => {
    return new Map(dailyActivity.map((item) => [item.dateKey, item]))
  }, [dailyActivity])

  const monthCells = useMemo(
    () => getCalendarMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  )

  const selectedActivity = selectedDateKey
    ? getDayActivity(dailyActivityMap, selectedDateKey)
    : null

  function moveMonth(offset: number) {
    const nextDate = new Date(viewYear, viewMonth + offset, 1)
    setViewYear(nextDate.getFullYear())
    setViewMonth(nextDate.getMonth())
    setSelectedDateKey(null)
  }

  const calendarBody = (
    <>
      <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-1 py-2 text-center text-xs font-semibold text-neutral-500 sm:text-sm"
          >
            {label}
          </div>
        ))}

        {monthCells.map((cell) => {
          const activity = getDayActivity(dailyActivityMap, cell.dateKey)
          const isSelected = selectedDateKey === cell.dateKey
          const isToday = cell.dateKey === todayKey
          const hasActivity = hasDayActivity(activity)

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => setSelectedDateKey(cell.dateKey)}
              className={`min-h-[72px] rounded-lg border px-1 py-2 text-left transition-colors sm:min-h-[96px] sm:px-2 sm:py-3 ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : isToday
                    ? 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                    : cell.isCurrentMonth
                      ? 'border-neutral-200 bg-white hover:bg-neutral-50'
                      : 'border-transparent bg-neutral-50 text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              <p className={`text-sm font-semibold sm:text-base ${isSelected ? 'text-white' : ''}`}>
                {cell.date.getDate()}
              </p>
              {cell.isCurrentMonth && (
                <>
                  {hasActivity ? (
                    <>
                      <p
                        className={`mt-1 text-[10px] font-semibold leading-tight sm:text-xs ${
                          isSelected ? 'text-neutral-100' : 'text-neutral-800'
                        }`}
                      >
                        {formatPrice(activity.revenue)}
                      </p>
                      <p
                        className={`mt-0.5 text-[10px] leading-tight sm:text-xs ${
                          isSelected ? 'text-neutral-200' : 'text-neutral-500'
                        }`}
                      >
                        주문 {activity.orderCount}건
                      </p>
                    </>
                  ) : (
                    <p
                      className={`mt-2 text-xs ${
                        isSelected ? 'text-neutral-300' : 'text-neutral-400'
                      }`}
                    >
                      —
                    </p>
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>

      {selectedActivity && selectedDateKey && (
        <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 sm:px-5 sm:py-5">
          <h3 className="text-base font-semibold text-neutral-900 sm:text-lg">선택한 날짜 요약</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-neutral-500">선택 날짜</dt>
              <dd className="mt-1 text-sm font-semibold text-neutral-900 sm:text-base">
                {formatDashboardDateLabel(selectedDateKey)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500">매출</dt>
              <dd className="mt-1 text-sm font-semibold text-neutral-900 sm:text-base">
                {formatPrice(selectedActivity.revenue)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500">주문 수</dt>
              <dd className="mt-1 text-sm font-semibold text-neutral-900 sm:text-base">
                {selectedActivity.orderCount.toLocaleString('ko-KR')}건
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-neutral-500 sm:text-sm">
            취소된 주문은 매출 합계에서 제외됩니다.
          </p>
        </div>
      )}
    </>
  )

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">매출 달력</h2>
          <p className="mt-1 text-sm text-neutral-500 sm:text-base">
            월별 매출 흐름을 날짜 단위로 확인합니다.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="inline-flex min-h-10 items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            aria-label="이전 달"
          >
            이전달
          </button>
          <p className="min-w-28 text-center text-base font-semibold text-neutral-900">
            {formatDashboardMonthLabel(viewYear, viewMonth)}
          </p>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="inline-flex min-h-10 items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            aria-label="다음 달"
          >
            다음달
          </button>
        </div>
      </div>

      <div className="mt-4 lg:hidden">
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800"
          aria-expanded={isExpanded}
        >
          {isExpanded ? '매출 달력 접기' : '매출 달력 펼치기'}
        </button>
      </div>

      <div className={`${isExpanded ? 'block' : 'hidden'} lg:block`}>{calendarBody}</div>
    </section>
  )
}
