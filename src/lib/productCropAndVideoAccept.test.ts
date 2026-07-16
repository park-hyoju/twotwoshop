import { describe, expect, it } from 'vitest'
import { PRODUCT_CROP_ASPECT_MAP } from '../components/admin/products/ProductImageCropModal'
import {
  DETAIL_MEDIA_ACCEPT,
  assertVideoFileSignature,
  filterAcceptedDetailMediaFiles,
  getDetailMediaRejectMessage,
  isAcceptedDetailMediaFile,
  isAcceptedVideoFile,
  isRecognizedUnsupportedVideoFile,
  isUploadableVideoFile,
  resolveProductVideoContentType,
  validateProductVideoFile,
} from './productVideoStorage'

function file(name: string, type: string, bytes = 'x'): File {
  return new File([bytes], name, { type })
}

/** Minimal ISO BMFF (ftyp) header used by MP4/MOV/M4V */
function mp4FamilyBytes(): Uint8Array {
  return new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d])
}

function webmBytes(): Uint8Array {
  return new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0])
}

describe('PRODUCT_CROP_ASPECT_MAP', () => {
  it('maps 1:1 to 1 and 4:5 to 0.8', () => {
    expect(PRODUCT_CROP_ASPECT_MAP['1:1']).toBe(1)
    expect(PRODUCT_CROP_ASPECT_MAP['4:5']).toBeCloseTo(0.8, 5)
  })
})

describe('DETAIL_MEDIA_ACCEPT', () => {
  it('includes image/* and video/* for photo library', () => {
    expect(DETAIL_MEDIA_ACCEPT).toContain('image/*')
    expect(DETAIL_MEDIA_ACCEPT).toContain('video/*')
    expect(DETAIL_MEDIA_ACCEPT).not.toContain('capture')
  })
})

describe('uploadable video recognition', () => {
  it('allows priority formats by MIME', () => {
    expect(isAcceptedVideoFile(file('a.mov', 'video/quicktime'))).toBe(true)
    expect(isAcceptedVideoFile(file('a.mp4', 'video/mp4'))).toBe(true)
    expect(isAcceptedVideoFile(file('a.m4v', 'video/x-m4v'))).toBe(true)
    expect(isAcceptedVideoFile(file('a.webm', 'video/webm'))).toBe(true)
  })

  it('allows empty MIME and octet-stream with extension', () => {
    expect(isUploadableVideoFile(file('sample.MOV', ''))).toBe(true)
    expect(isUploadableVideoFile(file('sample.mp4', ''))).toBe(true)
    expect(isUploadableVideoFile(file('sample.mov', 'application/octet-stream'))).toBe(true)
    expect(isUploadableVideoFile(file('sample.MP4', 'application/octet-stream'))).toBe(true)
  })

  it('recognizes but does not upload MKV/AVI/3GP/MPEG', () => {
    expect(isRecognizedUnsupportedVideoFile(file('a.mkv', 'video/x-matroska'))).toBe(true)
    expect(isRecognizedUnsupportedVideoFile(file('a.avi', ''))).toBe(true)
    expect(isRecognizedUnsupportedVideoFile(file('a.3gp', 'video/3gpp'))).toBe(true)
    expect(isRecognizedUnsupportedVideoFile(file('a.mpeg', 'video/mpeg'))).toBe(true)
    expect(isUploadableVideoFile(file('a.mkv', ''))).toBe(false)
    expect(() => validateProductVideoFile(file('a.mkv', ''))).toThrow(/재생 호환성/)
  })

  it('blocks documents and executables', () => {
    expect(isAcceptedVideoFile(file('a.txt', 'text/plain'))).toBe(false)
    expect(isAcceptedVideoFile(file('a.zip', 'application/zip'))).toBe(false)
    expect(isAcceptedVideoFile(file('a.exe', 'application/octet-stream'))).toBe(false)
    expect(isAcceptedDetailMediaFile(file('doc.pdf', 'application/pdf'))).toBe(false)
  })

  it('keeps existing image allowlist for detail media', () => {
    expect(isAcceptedDetailMediaFile(file('a.jpg', 'image/jpeg'))).toBe(true)
    expect(isAcceptedDetailMediaFile(file('a.PNG', 'image/png'))).toBe(true)
    expect(isAcceptedDetailMediaFile(file('a.webp', 'image/webp'))).toBe(true)
    expect(isAcceptedDetailMediaFile(file('a.heic', 'image/heic'))).toBe(false)
  })

  it('classifies mixed selections into accepted media only', () => {
    const mixed = [
      file('shot.jpg', 'image/jpeg'),
      file('clip.MOV', 'video/quicktime'),
      file('bad.mkv', 'video/x-matroska'),
      file('note.txt', 'text/plain'),
    ]
    const accepted = filterAcceptedDetailMediaFiles(mixed)
    expect(accepted.map((item) => item.name)).toEqual(['shot.jpg', 'clip.MOV'])
    expect(getDetailMediaRejectMessage([file('bad.mkv', '')])).toMatch(/재생 호환성/)
  })
})

describe('resolveProductVideoContentType', () => {
  it('maps extensions when MIME is empty or generic', () => {
    expect(resolveProductVideoContentType(file('a.mov', ''))).toBe('video/quicktime')
    expect(resolveProductVideoContentType(file('a.MP4', 'application/octet-stream'))).toBe(
      'video/mp4',
    )
    expect(resolveProductVideoContentType(file('a.m4v', ''))).toBe('video/x-m4v')
    expect(resolveProductVideoContentType(file('a.webm', ''))).toBe('video/webm')
  })
})

describe('assertVideoFileSignature', () => {
  it('accepts ftyp MP4/MOV headers and rejects disguised files', async () => {
    const mov = new File([mp4FamilyBytes()], 'clip.MOV', { type: 'video/quicktime' })
    await expect(assertVideoFileSignature(mov)).resolves.toBeUndefined()

    const webm = new File([webmBytes()], 'clip.webm', { type: 'video/webm' })
    await expect(assertVideoFileSignature(webm)).resolves.toBeUndefined()

    const fake = new File([new Uint8Array(12).fill(0)], 'clip.mp4', {
      type: 'application/octet-stream',
    })
    await expect(assertVideoFileSignature(fake)).rejects.toThrow(/일치하지 않습니다/)
  })
})
