import { describe, expect, it } from 'vitest'
import {
  isAcceptedVideoFile,
  resolveProductVideoContentType,
  validateProductVideoFile,
} from './productVideoStorage'

describe('resolveProductVideoContentType', () => {
  it('uses file.type when present', () => {
    const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' })
    expect(resolveProductVideoContentType(file)).toBe('video/mp4')
  })

  it('infers video/mp4 from extension when file.type is empty', () => {
    const file = new File(['x'], 'clip.mp4', { type: '' })
    expect(resolveProductVideoContentType(file)).toBe('video/mp4')
  })

  it('infers MIME from mobile extensions when file.type is empty', () => {
    expect(resolveProductVideoContentType(new File(['x'], 'a.mov', { type: '' }))).toBe(
      'video/quicktime',
    )
    expect(resolveProductVideoContentType(new File(['x'], 'a.m4v', { type: '' }))).toBe(
      'video/x-m4v',
    )
    expect(resolveProductVideoContentType(new File(['x'], 'a.webm', { type: '' }))).toBe(
      'video/webm',
    )
  })
})

describe('isAcceptedVideoFile', () => {
  it('accepts common mobile formats by MIME or extension', () => {
    expect(isAcceptedVideoFile(new File(['x'], 'a.mov', { type: 'video/quicktime' }))).toBe(true)
    expect(isAcceptedVideoFile(new File(['x'], 'a.MOV', { type: '' }))).toBe(true)
    expect(isAcceptedVideoFile(new File(['x'], 'a.mp4', { type: 'application/octet-stream' }))).toBe(
      true,
    )
    expect(isAcceptedVideoFile(new File(['x'], 'a.webm', { type: 'video/webm' }))).toBe(true)
    expect(isAcceptedVideoFile(new File(['x'], 'a.3gp', { type: 'video/3gpp' }))).toBe(false)
    expect(isAcceptedVideoFile(new File(['x'], 'a.mkv', { type: '' }))).toBe(false)
    expect(isAcceptedVideoFile(new File(['x'], 'a.txt', { type: 'text/plain' }))).toBe(false)
  })

  it('rejects unsupported containers with a clear message', () => {
    expect(() => validateProductVideoFile(new File(['x'], 'a.mkv', { type: '' }))).toThrow(
      /재생 호환성/,
    )
  })
})
