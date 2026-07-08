import { describe, expect, it } from 'vitest'
import {
  getProductImageSizeWarning,
  validateProductImageForGallery,
} from './productImagePrepare'
import { PRODUCT_IMAGE_WARN_BYTES } from './productImageStorage'

describe('productImagePrepare', () => {
  it('warns when file is 10MB or larger', () => {
    const small = new File([new Uint8Array(1024)], 'small.jpg', { type: 'image/jpeg' })
    const large = new File([new Uint8Array(PRODUCT_IMAGE_WARN_BYTES)], 'large.jpg', {
      type: 'image/jpeg',
    })

    expect(getProductImageSizeWarning(small)).toBe(false)
    expect(getProductImageSizeWarning(large)).toBe(true)
  })

  it('rejects unsupported formats', () => {
    const gif = new File([new Uint8Array(8)], 'anim.gif', { type: 'image/gif' })
    expect(validateProductImageForGallery(gif)).toContain('JPG')
  })

  it('accepts jpeg/png/webp', () => {
    const jpeg = new File([new Uint8Array(8)], 'photo.jpg', { type: 'image/jpeg' })
    expect(validateProductImageForGallery(jpeg)).toBeNull()
  })
})
