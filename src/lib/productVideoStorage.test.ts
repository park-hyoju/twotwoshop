import { describe, expect, it } from 'vitest'
import {
  isAcceptedVideoFile,
  resolveProductVideoContentType,
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
    expect(resolveProductVideoContentType(new File(['x'], 'a.mkv', { type: '' }))).toBe(
      'video/x-matroska',
    )
    expect(resolveProductVideoContentType(new File(['x'], 'a.avi', { type: '' }))).toBe(
      'video/x-msvideo',
    )
    expect(resolveProductVideoContentType(new File(['x'], 'a.3gp', { type: '' }))).toBe(
      'video/3gpp',
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
    expect(isAcceptedVideoFile(new File(['x'], 'a.3gp', { type: 'video/3gpp' }))).toBe(true)
    expect(isAcceptedVideoFile(new File(['x'], 'a.mkv', { type: '' }))).toBe(true)
    expect(isAcceptedVideoFile(new File(['x'], 'a.txt', { type: 'text/plain' }))).toBe(false)
  })
})
