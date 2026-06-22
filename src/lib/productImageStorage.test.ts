import { describe, expect, it } from 'vitest'
import { filterAcceptedImageFiles, isAcceptedImageFile, isPlaceholderProductImage } from './productImageStorage'

describe('productImageStorage', () => {
  it('accepts common image mime types and extension-only files', () => {
    expect(isAcceptedImageFile({ type: 'image/jpeg', name: 'a.jpg' } as File)).toBe(true)
    expect(isAcceptedImageFile({ type: '', name: 'photo.PNG' } as File)).toBe(true)
    expect(isAcceptedImageFile({ type: 'application/pdf', name: 'doc.pdf' } as File)).toBe(false)
  })

  it('filters only accepted files', () => {
    const files = [
      { type: 'image/png', name: 'ok.png' },
      { type: 'application/pdf', name: 'bad.pdf' },
      { type: '', name: 'legacy.jpg' },
    ] as File[]

    expect(filterAcceptedImageFiles(files).map((file) => file.name)).toEqual(['ok.png', 'legacy.jpg'])
  })

  it('detects placeholder product images', () => {
    expect(isPlaceholderProductImage('/images/placeholder/shirt.jpg')).toBe(true)
    expect(isPlaceholderProductImage('https://example.com/a.jpg')).toBe(false)
  })
})
