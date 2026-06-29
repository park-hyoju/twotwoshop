import { describe, expect, it } from 'vitest'
import { buildStorefrontNavItems } from '../constants/productCategories'

describe('buildStorefrontNavItems', () => {
  it('uses unified menu order with 공용 before 라이브방송', () => {
    const items = buildStorefrontNavItems()

    expect(items.map((item) => item.label)).toEqual([
      '홈',
      '신상품',
      '인기상품',
      '특가상품',
      '여성',
      '남성',
      '공용',
      '라이브방송',
    ])
  })

  it('places 향수 under 공용 children', () => {
    const common = buildStorefrontNavItems().find((item) => item.label === '공용')

    expect(common?.children?.map((child) => child.label)).toEqual([
      '신발',
      '가방',
      '벨트',
      '액세서리',
      '향수',
      '기타',
    ])
  })

  it('does not include standalone 향수 menu', () => {
    const labels = buildStorefrontNavItems().map((item) => item.label)

    expect(labels).not.toContain('향수')
  })
})
