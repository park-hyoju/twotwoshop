import { describe, expect, it } from 'vitest'
import {
  parseProductDescription,
  serializeProductDescription,
  getProductDescriptionPlainText,
  PRODUCT_DESC_PREFIX,
} from './productDescriptionFormat'

describe('productDescriptionFormat', () => {
  it('round-trips formatted description', () => {
    const serialized = serializeProductDescription({
      text: '와이드핏\n신축성 좋음',
      fontSize: 'large',
      fontWeight: 'bold',
      align: 'center',
    })

    expect(serialized.startsWith(PRODUCT_DESC_PREFIX)).toBe(true)
    expect(parseProductDescription(serialized)).toEqual({
      text: '와이드핏\n신축성 좋음',
      fontSize: 'large',
      fontWeight: 'bold',
      align: 'center',
    })
  })

  it('treats legacy plain text as normal formatting', () => {
    expect(parseProductDescription('기본 설명')).toEqual({
      text: '기본 설명',
      fontSize: 'normal',
      fontWeight: 'normal',
      align: 'left',
    })
    expect(getProductDescriptionPlainText('기본 설명')).toBe('기본 설명')
  })
})
