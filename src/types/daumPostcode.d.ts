export interface DaumPostcodeData {
  zonecode: string
  roadAddress: string
  jibunAddress: string
  userSelectedType: 'R' | 'J'
  bname: string
  buildingName: string
  apartment: 'Y' | 'N'
}

export interface DaumPostcodeInstance {
  embed: (element: HTMLElement) => void
  open: () => void
}

export interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void
  onclose?: (state: 'FORCE_CLOSE' | 'COMPLETE_CLOSE') => void
  width?: string | number
  height?: string | number
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: DaumPostcodeOptions) => DaumPostcodeInstance
    }
  }
}

export {}
