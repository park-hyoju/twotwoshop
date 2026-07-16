import { describe, expect, it } from 'vitest'
import { PRODUCT_CROP_ASPECT_MAP } from '../components/admin/products/ProductImageCropModal'
import { isAcceptedVideoFile } from './productVideoStorage'

describe('PRODUCT_CROP_ASPECT_MAP', () => {
  it('maps 1:1 to 1 and 4:5 to 0.8', () => {
    expect(PRODUCT_CROP_ASPECT_MAP['1:1']).toBe(1)
    expect(PRODUCT_CROP_ASPECT_MAP['4:5']).toBeCloseTo(0.8, 5)
  })
})

describe('iPhone MOV acceptance', () => {
  it('accepts video/quicktime and .mov', () => {
    expect(
      isAcceptedVideoFile(new File(['x'], 'IMG_0001.MOV', { type: 'video/quicktime' })),
    ).toBe(true)
    expect(isAcceptedVideoFile(new File(['x'], 'clip.mov', { type: '' }))).toBe(true)
  })
})
