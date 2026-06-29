export interface ChatOperatingHours {
  label: string
  openHour: number
  openMinute: number
  closeHour: number
  closeMinute: number
  timezone: string
}

export interface ChatSupportPolicy {
  operatingHours: ChatOperatingHours
  averageResponseLabel: string
  offHoursNotice: string
}

export const DEFAULT_CHAT_SUPPORT_POLICY: ChatSupportPolicy = {
  operatingHours: {
    label: '11:00 ~ 19:00',
    openHour: 11,
    openMinute: 0,
    closeHour: 19,
    closeMinute: 0,
    timezone: 'Asia/Seoul',
  },
  averageResponseLabel: '평균 10분 이내 답변',
  offHoursNotice: '문의 남겨주시면 순차 답변드려요 💛',
}

function getMinutesInTimezone(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date)

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')

  return hour * 60 + minute
}

export function isChatSupportOpen(
  date = new Date(),
  policy: ChatSupportPolicy = DEFAULT_CHAT_SUPPORT_POLICY,
): boolean {
  const { operatingHours } = policy
  const currentMinutes = getMinutesInTimezone(date, operatingHours.timezone)
  const openMinutes = operatingHours.openHour * 60 + operatingHours.openMinute
  const closeMinutes = operatingHours.closeHour * 60 + operatingHours.closeMinute

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes
}

export function getChatSupportStatusLabel(
  date = new Date(),
  policy: ChatSupportPolicy = DEFAULT_CHAT_SUPPORT_POLICY,
): {
  isOpen: boolean
  label: string
  statusLine: string
} {
  const isOpen = isChatSupportOpen(date, policy)

  if (isOpen) {
    return {
      isOpen: true,
      label: '상담 가능',
      statusLine: `🟢 상담 가능 · ${policy.averageResponseLabel}`,
    }
  }

  return {
    isOpen: false,
    label: '상담 종료',
    statusLine: `⚪ 상담 종료 · ${policy.operatingHours.label}`,
  }
}

export function getPendingQueueMessage(pendingCount: number | null): string {
  if (pendingCount === null) {
    return '현재 빠르게 답변 가능해요.'
  }

  if (pendingCount <= 0) {
    return '현재 빠르게 답변 가능해요.'
  }

  return `현재 문의 대기 ${pendingCount.toLocaleString('ko-KR')}건 · 답변이 조금 지연될 수 있어요.`
}
