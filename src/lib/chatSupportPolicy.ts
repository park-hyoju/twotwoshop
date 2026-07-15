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
    label: '문의 접수 24시간 가능',
    openHour: 11,
    openMinute: 0,
    closeHour: 19,
    closeMinute: 0,
    timezone: 'Asia/Seoul',
  },
  averageResponseLabel: '영업일 기준 최대 24시간 이내 답변',
  offHoursNotice: '문의는 언제든 남겨주세요. 순차적으로 확인 후 답변드립니다.',
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
      label: '문의 접수 가능',
      statusLine: `문의는 언제든 남겨주세요 · ${policy.averageResponseLabel}`,
    }
  }

  return {
    isOpen: false,
    label: '문의 접수 가능',
    statusLine: `문의는 언제든 남겨주세요 · ${policy.offHoursNotice}`,
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
