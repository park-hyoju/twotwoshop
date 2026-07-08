import { describe, expect, it } from 'vitest'
import {
  buildAdminProductFormFiles,
  hasDoneGalleryImage,
  isGalleryImageBusy,
  isGalleryImageDone,
  type ProductGalleryImage,
} from './ProductImageGalleryManager'

function makeImage(overrides: Partial<ProductGalleryImage>): ProductGalleryImage {
  return {
    id: 'test-1',
    previewUrl: 'blob:test',
    file: new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
    remoteUrl: null,
    status: 'done',
    progress: 100,
    errorMessage: null,
    sourceFileName: 'a.jpg',
    sizeWarning: false,
    ...overrides,
  }
}

describe('ProductImageGalleryManager helpers', () => {
  it('treats done as usable and busy states as not save-ready', () => {
    expect(isGalleryImageDone(makeImage({ status: 'done' }))).toBe(true)
    expect(isGalleryImageBusy(makeImage({ status: 'processing' }))).toBe(true)
    expect(isGalleryImageBusy(makeImage({ status: 'uploading' }))).toBe(true)
    expect(isGalleryImageBusy(makeImage({ status: 'cropping' }))).toBe(true)
    expect(isGalleryImageBusy(makeImage({ status: 'done' }))).toBe(false)
    expect(hasDoneGalleryImage([makeImage({ status: 'processing' })])).toBe(false)
    expect(hasDoneGalleryImage([makeImage({ status: 'done' })])).toBe(true)
  })

  it('builds form files from done images only', () => {
    const files = buildAdminProductFormFiles([
      makeImage({ id: 'main', status: 'done', file: new File(['a'], 'main.jpg') }),
      makeImage({ id: 'skip', status: 'processing', file: null }),
      makeImage({
        id: 'extra',
        status: 'done',
        file: new File(['b'], 'extra.jpg'),
      }),
    ])

    expect(files.thumbnail?.name).toBe('main.jpg')
    expect(files.additionalImages).toHaveLength(1)
    expect(files.additionalImages[0]?.name).toBe('extra.jpg')
  })
})
