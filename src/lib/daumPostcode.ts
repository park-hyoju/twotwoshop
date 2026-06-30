import type { DaumPostcodeData } from '../types/daumPostcode'

const DAUM_POSTCODE_SCRIPT_URL =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

let scriptLoadPromise: Promise<void> | null = null

export interface SelectedAddress {
  postalCode: string
  address: string
}

export function formatDaumPostcodeAddress(data: DaumPostcodeData): string {
  let address = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress

  if (data.userSelectedType === 'R') {
    let extra = ''

    if (data.bname && /[동|로|가]$/g.test(data.bname)) {
      extra += data.bname
    }

    if (data.buildingName !== '' && data.apartment === 'Y') {
      extra += extra !== '' ? `, ${data.buildingName}` : data.buildingName
    }

    if (extra !== '') {
      address += ` (${extra})`
    }
  }

  return address
}

export function mapDaumPostcodeData(data: DaumPostcodeData): SelectedAddress {
  return {
    postalCode: data.zonecode,
    address: formatDaumPostcodeAddress(data),
  }
}

export function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.daum?.Postcode) {
    return Promise.resolve()
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${DAUM_POSTCODE_SCRIPT_URL}"]`,
    )

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('주소 검색을 불러오지 못했습니다.')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = DAUM_POSTCODE_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptLoadPromise = null
      reject(new Error('주소 검색을 불러오지 못했습니다.'))
    }
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}
