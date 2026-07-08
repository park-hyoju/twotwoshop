import { describe, expect, it } from 'vitest'
import { formatKoreanWonDisplay, parseKoreanWonInput } from './adminMoneyInput'

describe('adminMoneyInput', () => {
  it('parses digits only from formatted input', () => {
    expect(parseKoreanWonInput('59,000원')).toBe(59000)
    expect(parseKoreanWonInput('59000')).toBe(59000)
    expect(parseKoreanWonInput('')).toBeNull()
    expect(parseKoreanWonInput('abc')).toBeNull()
  })

  it('formats amount as Korean won display', () => {
    expect(formatKoreanWonDisplay(59000)).toBe('59,000원')
    expect(formatKoreanWonDisplay(null)).toBe('')
    expect(formatKoreanWonDisplay(0)).toBe('0원')
  })
})
