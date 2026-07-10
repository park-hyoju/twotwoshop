import { describe, expect, it } from 'vitest'
import { resolveProductVideoContentType } from './productVideoStorage'

describe('resolveProductVideoContentType', () => {
  it('uses file.type when present', () => {
    const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' })
    expect(resolveProductVideoContentType(file)).toBe('video/mp4')
  })

  it('infers video/mp4 from extension when file.type is empty', () => {
    const file = new File(['x'], 'clip.mp4', { type: '' })
    expect(resolveProductVideoContentType(file)).toBe('video/mp4')
  })
})
