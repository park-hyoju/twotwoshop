import { describe, expect, it } from 'vitest'
import { formatDaumPostcodeAddress, mapDaumPostcodeData } from './daumPostcode'
import type { DaumPostcodeData } from '../types/daumPostcode'

const roadAddressData: DaumPostcodeData = {
  zonecode: '06236',
  roadAddress: '서울특별시 강남구 테헤란로 152',
  jibunAddress: '서울특별시 강남구 역삼동 737',
  userSelectedType: 'R',
  bname: '역삼동',
  buildingName: '강남파이낸스센터',
  apartment: 'Y',
}

describe('daumPostcode', () => {
  it('formats road address with building name', () => {
    expect(formatDaumPostcodeAddress(roadAddressData)).toBe(
      '서울특별시 강남구 테헤란로 152 (역삼동, 강남파이낸스센터)',
    )
  })

  it('maps postcode data to postal code and address', () => {
    expect(mapDaumPostcodeData(roadAddressData)).toEqual({
      postalCode: '06236',
      address: '서울특별시 강남구 테헤란로 152 (역삼동, 강남파이낸스센터)',
    })
  })

  it('uses jibun address when user selected jibun', () => {
    const jibunData: DaumPostcodeData = {
      ...roadAddressData,
      userSelectedType: 'J',
    }

    expect(mapDaumPostcodeData(jibunData).address).toBe('서울특별시 강남구 역삼동 737')
  })
})
