import { describe, expect, it } from 'vitest'
import {
  filterAcceptedImageFiles,
  isAcceptedImageFile,
  isHeicImageFile,
  isPlaceholderProductImage,
  PRODUCT_IMAGE_HEIC_MESSAGE,
  validateProductImageFile,
} from './productImageStorage'

describe('productImageStorage', () => {
  it('accepts jpg, png, and webp files', () => {
    expect(isAcceptedImageFile({ type: 'image/jpeg', name: 'a.jpg' } as File)).toBe(true)
    expect(isAcceptedImageFile({ type: 'image/png', name: 'photo.PNG' } as File)).toBe(true)
    expect(isAcceptedImageFile({ type: 'image/webp', name: 'photo.webp' } as File)).toBe(true)
    expect(isAcceptedImageFile({ type: '', name: 'legacy.jpg' } as File)).toBe(true)
    expect(isAcceptedImageFile({ type: 'application/pdf', name: 'doc.pdf' } as File)).toBe(false)
    expect(isAcceptedImageFile({ type: 'image/gif', name: 'a.gif' } as File)).toBe(false)
  })

  it('rejects heic files with dedicated message', () => {
    const heic = { type: 'image/heic', name: 'iphone.heic' } as File

    expect(isHeicImageFile(heic)).toBe(true)
    expect(isAcceptedImageFile(heic)).toBe(false)
    expect(() => validateProductImageFile(heic)).toThrow(PRODUCT_IMAGE_HEIC_MESSAGE)
  })

  it('filters only accepted files', () => {
    const files = [
      { type: 'image/png', name: 'ok.png' },
      { type: 'application/pdf', name: 'bad.pdf' },
      { type: '', name: 'legacy.jpg' },
      { type: 'image/heic', name: 'iphone.heic' },
    ] as File[]

    expect(filterAcceptedImageFiles(files).map((file) => file.name)).toEqual(['ok.png', 'legacy.jpg'])
  })

  it('detects placeholder product images', () => {
    expect(isPlaceholderProductImage('/images/placeholder/shirt.jpg')).toBe(true)
    expect(isPlaceholderProductImage('https://example.com/a.jpg')).toBe(false)
  })
})
