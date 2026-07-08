import { assertAdminRepositoryAccess } from '../lib/adminRepositoryGuard'
import { supabase } from '../lib/supabase'
import {
  buildProductVideoPath,
  getProductVideoPublicUrl,
  getProductVideoUploadEndpoint,
  getSupabaseAnonKey,
  validateProductVideoFile,
} from '../lib/productVideoStorage'
import { ProductImageUploadError } from './adminProductImageUploadService'

async function getAccessToken(): Promise<string> {
  await assertAdminRepositoryAccess(ProductImageUploadError)

  const { data, error } = await supabase!.auth.getSession()
  if (error) {
    throw new ProductImageUploadError('로그인 세션을 확인하지 못했습니다.', error)
  }

  const token = data.session?.access_token
  if (!token) {
    throw new ProductImageUploadError('로그인이 필요합니다. 관리자 계정으로 다시 로그인해주세요.')
  }

  return token
}

function uploadRawFileWithProgress(
  path: string,
  file: File,
  token: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const endpoint = getProductVideoUploadEndpoint(path)

    xhr.open('POST', endpoint)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', getSupabaseAnonKey())
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.setRequestHeader('x-upsert', 'true')

    xhr.upload.addEventListener('progress', (event) => {
      if (!onProgress) {
        return
      }

      if (event.lengthComputable) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
        return
      }

      onProgress(50)
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100)
        resolve()
        return
      }

      let message = '영상 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      if (xhr.status === 401 || xhr.status === 403) {
        message =
          '영상 업로드 권한이 없습니다. 관리자 로그인 상태와 Storage 정책을 확인해 주세요.'
      } else if (xhr.status === 413) {
        message = '영상 용량이 너무 큽니다. 500MB 이하 영상으로 다시 시도해 주세요.'
      }

      reject(new ProductImageUploadError(message, xhr.responseText))
    })

    xhr.addEventListener('error', () => {
      reject(
        new ProductImageUploadError(
          '네트워크 오류로 영상을 업로드하지 못했습니다. 연결 상태를 확인해 주세요.',
        ),
      )
    })

    xhr.send(file)
  })
}

export async function uploadProductVideo(
  productId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  validateProductVideoFile(file)

  const path = buildProductVideoPath(productId, file.name)
  const token = await getAccessToken()

  onProgress?.(5)
  await uploadRawFileWithProgress(path, file, token, (percent) => {
    onProgress?.(5 + Math.round(percent * 0.95))
  })

  return getProductVideoPublicUrl(path)
}
