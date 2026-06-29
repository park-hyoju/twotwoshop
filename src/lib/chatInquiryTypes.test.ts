import { describe, expect, it } from 'vitest'
import { getChatAutoGuideMessage } from './chatAutoGuideMessages'
import { mapQuickKeyToDbInquiryType } from './chatInquiryTypes'

describe('chatAutoGuideMessages', () => {
  it('returns auto guide text for each quick inquiry key', () => {
    expect(getChatAutoGuideMessage('shipping')).toContain('📦 안녕하세요')
    expect(getChatAutoGuideMessage('exchange')).toContain('🔄 안녕하세요')
    expect(getChatAutoGuideMessage('refund')).toContain('💰 안녕하세요')
    expect(getChatAutoGuideMessage('product')).toContain('🛍️ 안녕하세요')
    expect(getChatAutoGuideMessage('payment')).toContain('💳 안녕하세요')
    expect(getChatAutoGuideMessage('custom')).toContain('💬 안녕하세요')
  })
})

describe('chatInquiryTypes', () => {
  it('maps quick inquiry keys to database inquiry types', () => {
    expect(mapQuickKeyToDbInquiryType('shipping')).toBe('shipping')
    expect(mapQuickKeyToDbInquiryType('exchange')).toBe('exchange')
    expect(mapQuickKeyToDbInquiryType('refund')).toBe('refund')
    expect(mapQuickKeyToDbInquiryType('product')).toBe('product')
    expect(mapQuickKeyToDbInquiryType('payment')).toBe('other')
    expect(mapQuickKeyToDbInquiryType('custom')).toBe('other')
  })
})
