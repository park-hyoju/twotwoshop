import { describe, expect, it } from 'vitest'
import {
  extractImageSrcFromHtml,
  isLikelyImageDrag,
  KAKAO_DROP_HINT_MESSAGE,
} from './productImageDrop'

function mockDataTransfer(types: string[]): DataTransfer {
  return { types } as unknown as DataTransfer
}

describe('productImageDrop', () => {
  it('detects likely image drag types', () => {
    expect(isLikelyImageDrag(mockDataTransfer(['Files']))).toBe(true)
    expect(isLikelyImageDrag(mockDataTransfer(['text/html', 'text/plain']))).toBe(true)
    expect(isLikelyImageDrag(mockDataTransfer(['text/css']))).toBe(false)
  })

  it('extracts image src from html payload', () => {
    expect(
      extractImageSrcFromHtml('<img src="https://example.com/a.jpg" width="100">'),
    ).toBe('https://example.com/a.jpg')
    expect(extractImageSrcFromHtml('<div>no image</div>')).toBeNull()
  })

  it('defines kakao hint message', () => {
    expect(KAKAO_DROP_HINT_MESSAGE).toContain('카카오톡')
  })
})
