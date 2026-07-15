import type { ConsultationStatus } from '../types/consultationStatus'

export const CONSULTATION_STATUS_OPTIONS: Array<{
  value: ConsultationStatus
  label: string
  emoji: string
  statusLine: string
  toneClass: string
}> = [
  {
    value: 'available',
    label: '상담 가능',
    emoji: '🟢',
    statusLine: '문의는 언제든 남겨주세요 · 순차적으로 확인 후 답변드려요',
    toneClass: 'text-emerald-600',
  },
  {
    value: 'away',
    label: '잠시 자리비움',
    emoji: '🟡',
    statusLine: '문의는 언제든 남겨주세요 · 순차적으로 확인 후 답변드려요',
    toneClass: 'text-amber-600',
  },
  {
    value: 'busy',
    label: '문의 폭주',
    emoji: '🟠',
    statusLine: '문의는 언제든 남겨주세요 · 순차적으로 확인 후 답변드려요',
    toneClass: 'text-orange-600',
  },
  {
    value: 'closed',
    label: '영업 종료',
    emoji: '⚫',
    statusLine: '문의는 언제든 남겨주세요 · 순차적으로 확인 후 답변드려요',
    toneClass: 'text-neutral-500',
  },
]

export const DEFAULT_CONSULTATION_STATUS: ConsultationStatus = 'available'

const STATUS_MAP = Object.fromEntries(
  CONSULTATION_STATUS_OPTIONS.map((option) => [option.value, option]),
) as Record<ConsultationStatus, (typeof CONSULTATION_STATUS_OPTIONS)[number]>

export function isConsultationStatus(value: string): value is ConsultationStatus {
  return value in STATUS_MAP
}

export function getConsultationStatusOption(status: ConsultationStatus) {
  return STATUS_MAP[status]
}

export function getConsultationStatusLine(status: ConsultationStatus): string {
  const option = getConsultationStatusOption(status)
  return `${option.emoji} ${option.statusLine}`
}
