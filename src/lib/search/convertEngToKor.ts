const ENG_TO_JAMO: Record<string, string> = {
  q: 'ㅂ',
  Q: 'ㅃ',
  w: 'ㅈ',
  W: 'ㅉ',
  e: 'ㄷ',
  E: 'ㄸ',
  r: 'ㄱ',
  R: 'ㄲ',
  t: 'ㅅ',
  T: 'ㅆ',
  y: 'ㅛ',
  Y: 'ㅛ',
  u: 'ㅕ',
  U: 'ㅕ',
  i: 'ㅑ',
  I: 'ㅑ',
  o: 'ㅐ',
  O: 'ㅒ',
  p: 'ㅔ',
  P: 'ㅖ',
  a: 'ㅁ',
  A: 'ㅁ',
  s: 'ㄴ',
  S: 'ㄴ',
  d: 'ㅇ',
  D: 'ㅇ',
  f: 'ㄹ',
  F: 'ㄹ',
  g: 'ㅎ',
  G: 'ㅎ',
  h: 'ㅗ',
  H: 'ㅗ',
  j: 'ㅓ',
  J: 'ㅓ',
  k: 'ㅏ',
  K: 'ㅏ',
  l: 'ㅣ',
  L: 'ㅣ',
  z: 'ㅋ',
  Z: 'ㅋ',
  x: 'ㅌ',
  X: 'ㅌ',
  c: 'ㅊ',
  C: 'ㅊ',
  v: 'ㅍ',
  V: 'ㅍ',
  b: 'ㅠ',
  B: 'ㅠ',
  n: 'ㅜ',
  N: 'ㅜ',
  m: 'ㅡ',
  M: 'ㅡ',
}

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
const JONG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'

const JUNG_COMBINE: Record<string, string> = {
  'ㅗㅏ': 'ㅘ',
  'ㅗㅐ': 'ㅙ',
  'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ',
  'ㅜㅔ': 'ㅞ',
  'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ',
}

const JONG_COMBINE: Record<string, string> = {
  'ㄱㅅ': 'ㄳ',
  'ㄴㅈ': 'ㄵ',
  'ㄴㅎ': 'ㄶ',
  'ㄹㄱ': 'ㄺ',
  'ㄹㅁ': 'ㄻ',
  'ㄹㅂ': 'ㄼ',
  'ㄹㅅ': 'ㄽ',
  'ㄹㅌ': 'ㄾ',
  'ㄹㅍ': 'ㄿ',
  'ㄹㅎ': 'ㅀ',
  'ㅂㅅ': 'ㅄ',
}

function composeHangul(cho: string, jung: string, jong = ''): string {
  const choIndex = CHO.indexOf(cho)
  const jungIndex = JUNG.indexOf(jung)
  const jongIndex = JONG.indexOf(jong)

  if (choIndex < 0 || jungIndex < 0 || jongIndex < 0) {
    return `${cho}${jung}${jong}`.trim()
  }

  return String.fromCharCode(0xac00 + choIndex * 588 + jungIndex * 28 + jongIndex)
}

class HangulAssembler {
  private cho = ''
  private jung = ''
  private jong = ''
  private result = ''

  private commitCurrent(): void {
    if (this.cho && this.jung) {
      this.result += composeHangul(this.cho, this.jung, this.jong)
    } else {
      this.result += `${this.cho}${this.jung}${this.jong}`
    }

    this.cho = ''
    this.jung = ''
    this.jong = ''
  }

  private splitJongForVowel(jung: string): void {
    const pendingJong = this.jong
    this.jong = ''
    this.commitCurrent()

    if (CHO.includes(pendingJong)) {
      this.cho = pendingJong
      this.jung = jung
      return
    }

    this.result += pendingJong
    this.jung = jung
  }

  private pushJamo(jamo: string): void {
    if (!this.cho) {
      if (isJungseong(jamo)) {
        this.result += jamo
        return
      }

      this.cho = jamo
      return
    }

    if (!this.jung) {
      if (isJungseong(jamo)) {
        this.jung = jamo
        return
      }

      this.commitCurrent()
      this.cho = jamo
      return
    }

    if (!this.jong) {
      const combinedJung = JUNG_COMBINE[`${this.jung}${jamo}`]
      if (combinedJung && isJungseong(jamo)) {
        this.jung = combinedJung
        return
      }

      if (isJungseong(jamo)) {
        this.commitCurrent()
        this.jung = jamo
        return
      }

      if (canBeJongseong(jamo)) {
        this.jong = jamo
        return
      }

      this.commitCurrent()
      this.cho = jamo
      return
    }

    const combinedJong = JONG_COMBINE[`${this.jong}${jamo}`]
    if (combinedJong) {
      this.jong = combinedJong
      return
    }

    if (isJungseong(jamo)) {
      this.splitJongForVowel(jamo)
      return
    }

    this.commitCurrent()
    this.cho = jamo
  }

  input(jamo: string): void {
    this.pushJamo(jamo)
  }

  finish(): string {
    this.commitCurrent()
    return this.result
  }
}

function isJungseong(jamo: string): boolean {
  return JUNG.includes(jamo)
}

function canBeJongseong(jamo: string): boolean {
  return JONG.includes(jamo) && jamo !== ' '
}

function assembleHangul(jamos: string): string {
  const assembler = new HangulAssembler()

  for (const jamo of jamos) {
    assembler.input(jamo)
  }

  return assembler.finish()
}

/** Returns true when the string looks like English keyboard input for Korean. */
export function isEngKeyboardInput(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  return /^[a-zA-Z]+$/.test(trimmed)
}

/** Convert mistyped English keyboard input into Korean hangul. */
export function convertEngToKor(value: string): string {
  const jamos = [...value]
    .map((char) => ENG_TO_JAMO[char] ?? char)
    .join('')

  return assembleHangul(jamos)
}
