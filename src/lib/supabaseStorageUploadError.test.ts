import { describe, expect, it } from 'vitest'
import {
  buildStorageUploadErrorMessage,
  parseSupabaseStorageUploadError,
} from './supabaseStorageUploadError'

describe('parseSupabaseStorageUploadError', () => {
  it('parses Supabase invalid mime type JSON', () => {
    const body = JSON.stringify({
      statusCode: '415',
      error: 'invalid_mime_type',
      message: 'mime type application/octet-stream is not supported',
    })

    expect(parseSupabaseStorageUploadError(body, 415)).toBe(
      'mime type application/octet-stream is not supported (invalid_mime_type)',
    )
  })

  it('parses bucket not found JSON', () => {
    const body = JSON.stringify({
      statusCode: '404',
      error: 'Bucket not found',
      message: 'Bucket not found',
    })

    expect(parseSupabaseStorageUploadError(body, 404)).toBe('Bucket not found (Bucket not found)')
  })

  it('builds user-facing upload failure message', () => {
    const body = JSON.stringify({
      message: 'mime type video/mp4 is not supported',
      error: 'invalid_mime_type',
    })

    expect(buildStorageUploadErrorMessage(415, body)).toBe(
      '업로드 실패\nmime type video/mp4 is not supported (invalid_mime_type)',
    )
  })
})
