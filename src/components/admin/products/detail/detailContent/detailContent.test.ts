import { describe, expect, it, vi } from 'vitest'
import { createEmptyProductDetailForm } from '../../../../../lib/adminProductDetailDefaults'
import { buildIntroShortDescriptionFromForm, syncProductImagesToForm } from './detailContent'
import { parseProductIntroPayload } from '../../../../../lib/productIntroContent'

describe('syncProductImagesToForm', () => {
  it('preserves product description when syncing images', () => {
    const onChange = vi.fn()

    syncProductImagesToForm(
      ['https://example.com/thumb.jpg', 'https://example.com/gallery.jpg'],
      ['https://example.com/detail.jpg'],
      onChange,
    )

    const changedFields = onChange.mock.calls.map(([field]) => field)
    expect(changedFields).not.toContain('description')
    expect(changedFields).toContain('short_description')
    expect(changedFields).toContain('thumbnail')
    expect(changedFields).toContain('images')
  })
})

describe('buildIntroShortDescriptionFromForm', () => {
  it('embeds detail media urls in intro payload', () => {
    const form = createEmptyProductDetailForm('p-1')
    form.thumbnail = 'https://example.com/thumb.jpg'
    form.detail_media = [
      {
        type: 'image',
        url: 'https://example.com/detail.jpg',
        order: 0,
        filename: 'detail.jpg',
      },
      {
        type: 'video',
        url: 'https://example.com/detail.mp4',
        order: 1,
        filename: 'detail.mp4',
      },
    ]

    const shortDescription = buildIntroShortDescriptionFromForm(form)
    const payload = parseProductIntroPayload(shortDescription)

    expect(payload?.detailImages).toEqual([
      'https://example.com/detail.jpg',
      'https://example.com/detail.mp4',
    ])
  })
})
