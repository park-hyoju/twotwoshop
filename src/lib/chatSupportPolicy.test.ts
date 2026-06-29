import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CHAT_SUPPORT_POLICY,
  getChatSupportStatusLabel,
  getPendingQueueMessage,
  isChatSupportOpen,
} from './chatSupportPolicy'

describe('chatSupportPolicy', () => {
  it('detects open hours within configured window', () => {
    const openDate = new Date('2026-06-24T12:00:00+09:00')
    const closedDate = new Date('2026-06-24T20:00:00+09:00')

    expect(isChatSupportOpen(openDate, DEFAULT_CHAT_SUPPORT_POLICY)).toBe(true)
    expect(isChatSupportOpen(closedDate, DEFAULT_CHAT_SUPPORT_POLICY)).toBe(false)
  })

  it('returns support status labels', () => {
    const openStatus = getChatSupportStatusLabel(new Date('2026-06-24T12:00:00+09:00'))
    const closedStatus = getChatSupportStatusLabel(new Date('2026-06-24T20:00:00+09:00'))

    expect(openStatus.label).toBe('상담 가능')
    expect(closedStatus.label).toBe('상담 종료')
  })

  it('formats pending queue message softly', () => {
    expect(getPendingQueueMessage(0)).toContain('빠르게 답변')
    expect(getPendingQueueMessage(3)).toContain('3건')
  })
})
