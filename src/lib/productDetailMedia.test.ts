import { describe, expect, it } from 'vitest'
import { isDetailVideoUrl } from './productDetailMedia'

describe('productDetailMedia', () => {
  it('detects video urls by extension', () => {
    expect(isDetailVideoUrl('https://example.com/detail.mp4')).toBe(true)
    expect(isDetailVideoUrl('https://example.com/detail.webm?token=1')).toBe(true)
    expect(isDetailVideoUrl('https://example.com/detail.jpg')).toBe(false)
  })
})
