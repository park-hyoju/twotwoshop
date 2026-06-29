import { describe, expect, it } from 'vitest'
import {
  getConsultationStatusLine,
  getConsultationStatusOption,
} from './consultationStatusDisplay'

describe('consultationStatusDisplay', () => {
  it('returns customer-facing status lines', () => {
    expect(getConsultationStatusLine('available')).toBe(
      '🟢 상담 가능 · 보통 빠르게 확인해요',
    )
    expect(getConsultationStatusLine('away')).toBe(
      '🟡 잠시 자리를 비웠어요 · 조금 늦을 수 있어요',
    )
    expect(getConsultationStatusLine('busy')).toBe(
      '🟠 문의가 많아요 · 순서대로 답변드리고 있어요',
    )
    expect(getConsultationStatusLine('closed')).toBe(
      '⚫ 현재 상담이 종료되었어요 · 영업시간에 확인해드릴게요',
    )
  })

  it('exposes admin labels', () => {
    expect(getConsultationStatusOption('busy').label).toBe('문의 폭주')
  })
})
