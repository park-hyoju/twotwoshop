import { describe, expect, it } from 'vitest'
import { resolveSafeInternalPath } from './safeRedirect'
import { ROUTES } from './routes'

describe('resolveSafeInternalPath', () => {
  it('allows safe internal storefront paths', () => {
    expect(
      resolveSafeInternalPath('/mypage/orders', {
        fallback: ROUTES.mypage,
        disallowedPaths: [ROUTES.signin],
      }),
    ).toBe('/mypage/orders')
  })

  it('blocks protocol-relative and absolute URLs', () => {
    const fallback = ROUTES.mypage

    expect(resolveSafeInternalPath('//evil.com', { fallback })).toBe(fallback)
    expect(resolveSafeInternalPath('https://evil.com', { fallback })).toBe(fallback)
    expect(resolveSafeInternalPath('http://evil.com/path', { fallback })).toBe(fallback)
  })

  it('enforces admin prefix when configured', () => {
    expect(
      resolveSafeInternalPath('/admin/orders', {
        fallback: '/admin',
        allowedPrefix: '/admin',
      }),
    ).toBe('/admin/orders')

    expect(
      resolveSafeInternalPath('/mypage', {
        fallback: '/admin',
        allowedPrefix: '/admin',
      }),
    ).toBe('/admin')
  })
})
