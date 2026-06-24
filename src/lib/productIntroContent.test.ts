import { describe, expect, it } from 'vitest'
import { getProductDescriptionText } from './productDetailContent'
import {
  getDetailImageUrls,
  getLegacyDescriptionText,
  isProductIntroPayload,
  isRawJsonDescription,
  serializeProductIntroPayload,
} from './productIntroContent'

describe('productIntroContent', () => {
  it('does not expose JSON payload as description text', () => {
    const payload = serializeProductIntroPayload({
      galleryCount: 1,
      detailImages: ['https://example.com/a.jpg'],
    })

    expect(isProductIntroPayload(payload)).toBe(true)
    expect(getLegacyDescriptionText(payload, ' ')).toBe('')
    expect(getProductDescriptionText(payload, ' ')).toBe('')
    expect(getDetailImageUrls(payload, [])).toEqual(['https://example.com/a.jpg'])
  })

  it('blocks raw JSON in description field', () => {
    const raw = '{"galleryCount":2,"items":[]}'
    expect(isRawJsonDescription(raw)).toBe(true)
    expect(getLegacyDescriptionText('', raw)).toBe('')
    expect(getProductDescriptionText('', raw)).toBe('')
  })

  it('falls back to legacy description when parse payload is absent', () => {
    expect(getLegacyDescriptionText('', '기존 설명')).toBe('기존 설명')
  })
})
