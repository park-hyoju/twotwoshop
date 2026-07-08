import { describe, expect, it, vi } from 'vitest'
import { syncProductImagesToForm } from './detailContent'

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
