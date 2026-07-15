import { describe, expect, it } from 'vitest'
import {
  getConsultationStatusLine,
  getConsultationStatusOption,
} from './consultationStatusDisplay'

describe('consultationStatusDisplay', () => {
  it('returns customer-facing sequential reply status lines', () => {
    const sequentialLine = '문의는 언제든 남겨주세요 · 순차적으로 확인 후 답변드려요'

    expect(getConsultationStatusLine('available')).toBe(`🟢 ${sequentialLine}`)
    expect(getConsultationStatusLine('away')).toBe(`🟡 ${sequentialLine}`)
    expect(getConsultationStatusLine('busy')).toBe(`🟠 ${sequentialLine}`)
    expect(getConsultationStatusLine('closed')).toBe(`⚫ ${sequentialLine}`)
  })

  it('exposes admin labels', () => {
    expect(getConsultationStatusOption('busy').label).toBe('문의 폭주')
  })
})
