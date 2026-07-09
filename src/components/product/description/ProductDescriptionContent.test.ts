import { describe, expect, it } from 'vitest'
import { serializeProductDescription } from '../../../lib/productDescriptionFormat'
import { getProductDescriptionContentClassName } from './ProductDescriptionContent'

describe('ProductDescriptionContent', () => {
  it('applies the same typography classes as storefront formatting', () => {
    const description = serializeProductDescription({
      text: '와이드핏',
      fontSize: 'large',
      fontWeight: 'bold',
      align: 'center',
    })

    expect(getProductDescriptionContentClassName(description)).toBe(
      'whitespace-pre-wrap text-neutral-700 text-lg leading-8 sm:text-xl sm:leading-9 font-bold text-center',
    )
  })
})
