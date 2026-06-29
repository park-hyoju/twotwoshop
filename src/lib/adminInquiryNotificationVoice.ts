const VOICE_MESSAGE = '새 문의가 도착했어요.'
const VOICE_LANG = 'ko-KR'

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickKoreanVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) {
    return null
  }

  const voices = window.speechSynthesis.getVoices()
  const koreanVoice =
    voices.find((voice) => voice.lang === 'ko-KR') ??
    voices.find((voice) => voice.lang.startsWith('ko')) ??
    null

  return koreanVoice
}

async function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSynthesisSupported()) {
    return []
  }

  const existingVoices = window.speechSynthesis.getVoices()
  if (existingVoices.length > 0) {
    return existingVoices
  }

  return new Promise((resolve) => {
    const handleVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      resolve(window.speechSynthesis.getVoices())
    }

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      resolve(window.speechSynthesis.getVoices())
    }, 300)
  })
}

export async function speakInquiryNotification(): Promise<void> {
  if (!isSpeechSynthesisSupported()) {
    throw new Error('Speech synthesis is not supported in this browser')
  }

  await waitForVoices()

  await new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(VOICE_MESSAGE)
    utterance.lang = VOICE_LANG
    utterance.rate = 1.05
    utterance.pitch = 1.15

    const koreanVoice = pickKoreanVoice()
    if (koreanVoice) {
      utterance.voice = koreanVoice
    }

    utterance.onend = () => resolve()
    utterance.onerror = (event) => {
      reject(event.error ?? new Error('Speech synthesis failed'))
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}

export async function testInquiryNotificationVoice(): Promise<void> {
  console.log('[voice] test clicked')

  try {
    await speakInquiryNotification()
    console.log('[voice] test succeeded')
  } catch (error) {
    console.error('[voice] play failed', error)
    throw error
  }
}

export function isInquiryNotificationVoiceSupported(): boolean {
  return isSpeechSynthesisSupported()
}
