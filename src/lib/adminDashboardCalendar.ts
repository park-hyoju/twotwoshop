import type { AdminDashboardDayActivity } from '../types/adminDashboard'

interface OrderActivityRow {
  total_amount: number
  created_at: string
  status: string
}

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isCountableRevenueStatus(status: string): boolean {
  return status !== 'cancelled'
}

export function buildDailyActivityMap(
  rows: OrderActivityRow[],
): Map<string, AdminDashboardDayActivity> {
  const map = new Map<string, AdminDashboardDayActivity>()

  for (const row of rows) {
    const dateKey = toLocalDateKey(new Date(row.created_at))
    const current = map.get(dateKey) ?? { dateKey, revenue: 0, orderCount: 0 }

    current.orderCount += 1

    if (isCountableRevenueStatus(row.status)) {
      current.revenue += row.total_amount
    }

    map.set(dateKey, current)
  }

  return map
}

export function buildDailyActivityList(rows: OrderActivityRow[]): AdminDashboardDayActivity[] {
  return Array.from(buildDailyActivityMap(rows).values()).sort((a, b) =>
    a.dateKey.localeCompare(b.dateKey),
  )
}

export interface CalendarDayCell {
  date: Date
  dateKey: string
  isCurrentMonth: boolean
}

export function getCalendarMonthCells(year: number, month: number): CalendarDayCell[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7
  const gridStart = new Date(year, month, 1 - startOffset)
  const cells: CalendarDayCell[] = []

  for (let index = 0; index < totalCells; index += 1) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)

    cells.push({
      date,
      dateKey: toLocalDateKey(date),
      isCurrentMonth: date.getMonth() === month,
    })
  }

  return cells
}

export function formatDashboardMonthLabel(year: number, month: number): string {
  return `${year}년 ${month + 1}월`
}

export function formatDashboardDateLabel(dateKey: string): string {
  const date = parseDateKey(dateKey)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export function formatDashboardTodayLabel(date = new Date()): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

export function getEmptyDayActivity(dateKey: string): AdminDashboardDayActivity {
  return {
    dateKey,
    revenue: 0,
    orderCount: 0,
  }
}

export function getDayActivity(
  dailyActivityMap: Map<string, AdminDashboardDayActivity>,
  dateKey: string,
): AdminDashboardDayActivity {
  return dailyActivityMap.get(dateKey) ?? getEmptyDayActivity(dateKey)
}
