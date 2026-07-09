import { describe, expect, it } from 'vitest'
import { migrateDetailMedia, normalizeDetailMediaOrder, reindexDetailMediaByArrayOrder } from './detailMedia'
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

  it('preserves drag-reordered array positions', () => {
    const dragged = reindexDetailMediaByArrayOrder([
      {
        type: 'image',
        url: 'https://example.com/3.jpg',
        order: 2,
        filename: '3.jpg',
        thumbnail: null,
        duration: null,
        width: null,
        height: null,
      },
      {
        type: 'image',
        url: 'https://example.com/1.jpg',
        order: 0,
        filename: '1.jpg',
        thumbnail: null,
        duration: null,
        width: null,
        height: null,
      },
      {
        type: 'image',
        url: 'https://example.com/2.jpg',
        order: 1,
        filename: '2.jpg',
        thumbnail: null,
        duration: null,
        width: null,
        height: null,
      },
    ])

    expect(dragged.map((item) => item.url)).toEqual([
      'https://example.com/3.jpg',
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
    ])
    expect(dragged.map((item) => item.order)).toEqual([0, 1, 2])
  })
})
