import { describe, expect, it } from 'vitest'
import { PRODUCT_INTRO_PREFIX } from './productIntroContent'
import {
  buildProductGalleryImages,
  placeholderImageForSlug,
  resolveProductImages,
  resolveProductThumbnail,
} from './productImages'

describe('productImages', () => {
  it('uses storage thumbnail when present', () => {
    const storageUrl =
      'https://example.supabase.co/storage/v1/object/public/product-images/products/1/thumb.jpg'

    expect(resolveProductThumbnail(storageUrl, 'linen-shirt')).toBe(storageUrl)
  })

  it('falls back to placeholder thumbnail when missing', () => {
    expect(resolveProductThumbnail(null, 'linen-shirt')).toBe(
      placeholderImageForSlug('linen-shirt'),
    )
  })

  it('prefers real images over placeholder entries in gallery', () => {
    const storageUrl =
      'https://example.supabase.co/storage/v1/object/public/product-images/products/1/detail.jpg'

    expect(
      resolveProductImages(
        ['/images/placeholder/linen-shirt.jpg', storageUrl],
        storageUrl,
        'linen-shirt',
      ),
    ).toEqual([storageUrl])
  })

  it('uses storage thumbnail when images still contain placeholders', () => {
    const storageUrl =
      'https://example.supabase.co/storage/v1/object/public/product-images/products/1/thumb.jpg'

    expect(
      resolveProductImages(['/images/placeholder/linen-shirt.jpg'], storageUrl, 'linen-shirt'),
    ).toEqual([storageUrl])
  })

  it('builds deduplicated gallery with thumbnail first', () => {
    const thumb =
      'https://example.supabase.co/storage/v1/object/public/product-images/products/1/a.jpg'
    const second =
      'https://example.supabase.co/storage/v1/object/public/product-images/products/1/b.jpg'

    expect(buildProductGalleryImages(thumb, [second, thumb, second])).toEqual([thumb, second])
  })

  it('excludes detail images when intro payload is present', () => {
    const thumb =
      'https://example.supabase.co/storage/v1/object/public/product-images/products/1/a.jpg'
    const gallery =
      'https://example.supabase.co/storage/v1/object/public/product-images/products/1/b.jpg'
    const detail =
      'https://example.supabase.co/storage/v1/object/public/product-images/products/1/detail.jpg'
    const shortDescription = `${PRODUCT_INTRO_PREFIX}${JSON.stringify({
      galleryCount: 1,
      detailImages: [detail],
    })}`

    expect(buildProductGalleryImages(thumb, [gallery, detail], shortDescription)).toEqual([
      thumb,
      gallery,
    ])
  })
})
