import { speakInquiryNotification, testInquiryNotificationVoice } from './adminInquiryNotificationVoice'

const SOUND_ENABLED_STORAGE_KEY = 'admin-inquiry-sound-enabled'
const VOICE_ENABLED_STORAGE_KEY = 'admin-inquiry-voice-enabled'
const LEGACY_SOUND_ENABLED_STORAGE_KEY = 'admin_inquiry_sound_enabled'
const NOTIFICATION_MP3_PATH = '/sounds/notification.mp3'
const MP3_PLAY_TIMEOUT_MS = 500

const POONG_DURATION_SEC = 0.15
const POONG_START_FREQUENCY = 700
const POONG_END_FREQUENCY = 1400
const POONG_GAIN = 0.1

let sharedAudioContext: AudioContext | null = null
let cachedAudio: HTMLAudioElement | null = null
let mp3Available: boolean | null = null
let soundEnabled = false
let voiceEnabled = false

function readStoredSoundEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const saved = window.localStorage.getItem(SOUND_ENABLED_STORAGE_KEY)
  if (saved !== null) {
    return saved === 'true'
  }

  const legacySaved = window.localStorage.getItem(LEGACY_SOUND_ENABLED_STORAGE_KEY)
  if (legacySaved !== null) {
    window.localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, legacySaved)
    window.localStorage.removeItem(LEGACY_SOUND_ENABLED_STORAGE_KEY)
    return legacySaved === 'true'
  }

  return false
}

function readStoredVoiceEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(VOICE_ENABLED_STORAGE_KEY) === 'true'
}

function persistSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false')
}

function persistVoiceEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(VOICE_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false')
}

function setSoundEnabled(nextValue: boolean): void {
  soundEnabled = nextValue
  persistSoundEnabled(nextValue)
  console.log('[notification] enabled:', soundEnabled)
}

function setVoiceEnabled(nextValue: boolean): void {
  voiceEnabled = nextValue
  persistVoiceEnabled(nextValue)
  console.log('[notification] voiceEnabled:', voiceEnabled)
}

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }

  return (
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  )
}

function getOrCreateAudioContext(): AudioContext {
  const AudioContextClass = getAudioContextClass()
  if (!AudioContextClass) {
    throw new Error('AudioContext is not supported in this browser')
  }

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextClass()
  }

  return sharedAudioContext
}

export function getAdminNotificationAudioContextState(): AudioContextState | 'unsupported' {
  if (!getAudioContextClass()) {
    return 'unsupported'
  }

  try {
    return getOrCreateAudioContext().state
  } catch {
    return 'unsupported'
  }
}

async function resumeAudioContext(): Promise<AudioContext> {
  const context = getOrCreateAudioContext()
  console.log('[sound] AudioContext state before resume:', context.state)

  if (context.state === 'suspended') {
    await context.resume()
  }

  console.log('[sound] AudioContext state after resume:', context.state)

  if (context.state !== 'running') {
    throw new Error(`AudioContext is not running: ${context.state}`)
  }

  return context
}

function getCachedAudio(): HTMLAudioElement {
  if (!cachedAudio) {
    cachedAudio = new Audio(NOTIFICATION_MP3_PATH)
    cachedAudio.preload = 'auto'
  }

  return cachedAudio
}

async function tryPlayMp3(): Promise<boolean> {
  if (mp3Available === false) {
    return false
  }

  const audio = getCachedAudio()

  try {
    audio.currentTime = 0

    await Promise.race([
      audio.play(),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('mp3 play timeout')), MP3_PLAY_TIMEOUT_MS)
      }),
    ])

    mp3Available = true
    return true
  } catch {
    mp3Available = false
    return false
  }
}

async function playPoongFallback(): Promise<void> {
  const context = await resumeAudioContext()
  const startAt = context.currentTime
  const rampEndAt = startAt + POONG_DURATION_SEC * 0.72

  await new Promise<void>((resolve, reject) => {
    try {
      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(POONG_START_FREQUENCY, startAt)
      oscillator.frequency.exponentialRampToValueAtTime(POONG_END_FREQUENCY, rampEndAt)

      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.linearRampToValueAtTime(POONG_GAIN, startAt + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + POONG_DURATION_SEC)

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.onended = () => resolve()
      oscillator.start(startAt)
      oscillator.stop(startAt + POONG_DURATION_SEC)

      window.setTimeout(() => resolve(), POONG_DURATION_SEC * 1000 + 60)
    } catch (error) {
      reject(error)
    }
  })
}

async function playPoongSound(): Promise<void> {
  console.log('[sound] play poong', soundEnabled)
  await playPoongFallback()
}

/**
 * Play notification tone: mp3 if available, otherwise Web Audio '뿅' pop.
 */
export async function playNotificationSound(): Promise<void> {
  console.log('[sound] play', soundEnabled)

  await resumeAudioContext()

  const mp3Played = await tryPlayMp3()
  if (mp3Played) {
    return
  }

  await playPoongFallback()
}

soundEnabled = readStoredSoundEnabled()
voiceEnabled = readStoredVoiceEnabled()
console.log('[notification] enabled:', soundEnabled)
console.log('[notification] voiceEnabled:', voiceEnabled)

export function isAdminNotificationSoundEnabled(): boolean {
  if (typeof window !== 'undefined') {
    soundEnabled = readStoredSoundEnabled()
  }

  return soundEnabled
}

export function isAdminNotificationVoiceEnabled(): boolean {
  if (typeof window !== 'undefined') {
    voiceEnabled = readStoredVoiceEnabled()
  }

  return voiceEnabled
}

export function readAdminNotificationSoundPreference(): boolean {
  return readStoredSoundEnabled()
}

export function readAdminNotificationVoicePreference(): boolean {
  return readStoredVoiceEnabled()
}

export async function testNotificationSound(): Promise<void> {
  console.log('[sound] test clicked')

  try {
    await playPoongSound()
    console.log('[sound] test succeeded')
  } catch (error) {
    console.error('[sound] play failed', error)
    throw error
  }
}

export async function testNotificationVoice(): Promise<void> {
  await testInquiryNotificationVoice()
}

export async function enableAdminNotificationSound(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  setSoundEnabled(true)

  try {
    await resumeAudioContext()
    await playPoongSound()
    return true
  } catch (error) {
    console.error('[sound] prime failed but preference saved', error)
    return true
  }
}

export function disableAdminNotificationSound(): void {
  setSoundEnabled(false)
}

export function enableAdminNotificationVoice(): void {
  setVoiceEnabled(true)
}

export function disableAdminNotificationVoice(): void {
  setVoiceEnabled(false)
}

export async function playAdminNotificationAlert(): Promise<void> {
  const currentSoundEnabled = isAdminNotificationSoundEnabled()
  const currentVoiceEnabled = isAdminNotificationVoiceEnabled()

  if (!currentSoundEnabled && !currentVoiceEnabled) {
    return
  }

  if (currentVoiceEnabled) {
    console.log('[voice] play voice')
    try {
      await speakInquiryNotification()
    } catch (error) {
      console.error('[voice] play failed', error)
    }
  }

  if (currentSoundEnabled) {
    console.log('[notification] play sound')
    try {
      await playNotificationSound()
    } catch (error) {
      console.error('[sound] play failed', error)
    }
  }
}

/** @deprecated Use playAdminNotificationAlert */
export async function playAdminNotificationSound(): Promise<void> {
  await playAdminNotificationAlert()
}
