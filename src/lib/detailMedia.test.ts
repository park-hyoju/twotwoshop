import { describe, expect, it } from 'vitest'
import { migrateDetailMedia, normalizeDetailMediaOrder } from './detailMedia'
import { serializeProductIntroPayload } from './productIntroContent'

describe('detailMedia', () => {
  it('migrates legacy intro detail images', () => {
    const shortDescription = serializeProductIntroPayload({
      galleryCount: 0,
      detailImages: ['https://example.com/a.jpg', 'https://example.com/b.mp4'],
    })

    const items = migrateDetailMedia(null, shortDescription, [])

    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ type: 'image', url: 'https://example.com/a.jpg', order: 0 })
    expect(items[1]).toMatchObject({ type: 'video', url: 'https://example.com/b.mp4', order: 1 })
  })

  it('normalizes order indexes', () => {
    const items = normalizeDetailMediaOrder([
      {
        type: 'image',
        url: 'https://example.com/2.jpg',
        order: 2,
        filename: '2.jpg',
      },
      {
        type: 'video',
        url: 'https://example.com/1.mp4',
        order: 0,
        filename: '1.mp4',
      },
    ])

    expect(items.map((item) => item.order)).toEqual([0, 1])
    expect(items[0]?.url).toContain('1.mp4')
  })
})
