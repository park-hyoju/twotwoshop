interface SupabaseStorageErrorBody {
  message?: string
  error?: string
  statusCode?: string | number
  code?: string
}

/** Supabase Storage XHR 응답 본문에서 사용자에게 보여줄 메시지를 추출합니다. */
export function parseSupabaseStorageUploadError(
  responseText: string,
  status?: number,
): string | null {
  const trimmed = responseText.trim()
  if (!trimmed) {
    return null
  }

  try {
    const body = JSON.parse(trimmed) as SupabaseStorageErrorBody
    if (typeof body.message === 'string' && body.message.trim()) {
      const code = body.error ?? body.code
      return code ? `${body.message} (${code})` : body.message
    }
    if (typeof body.error === 'string' && body.error.trim()) {
      return body.error
    }
  } catch {
    // plain text response
  }

  if (trimmed.length <= 500) {
    return status ? `HTTP ${status}: ${trimmed}` : trimmed
  }

  return status ? `HTTP ${status}: ${trimmed.slice(0, 500)}…` : `${trimmed.slice(0, 500)}…`
}

export function buildStorageUploadErrorMessage(status: number, responseText: string): string {
  const parsed = parseSupabaseStorageUploadError(responseText, status)
  if (parsed) {
    return `업로드 실패\n${parsed}`
  }

  if (status === 401 || status === 403) {
    return `업로드 실패\n권한 없음 (HTTP ${status}). 관리자 로그인 및 Storage RLS를 확인하세요.`
  }

  if (status === 413 || status === 415) {
    return `업로드 실패\n파일 형식 또는 용량이 버킷 제한과 맞지 않습니다 (HTTP ${status}).`
  }

  return `업로드 실패\nHTTP ${status}`
}
