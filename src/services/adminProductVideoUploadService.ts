import { assertAdminRepositoryAccess } from '../lib/adminRepositoryGuard'
import { supabase } from '../lib/supabase'
import {
  PRODUCT_IMAGE_BUCKET,
  assertVideoFileSignature,
  buildProductVideoPath,
  getProductVideoPublicUrl,
  getProductVideoUploadEndpoint,
  getSupabaseAnonKey,
  resolveProductVideoContentType,
  validateProductVideoFile,
} from '../lib/productVideoStorage'
import { buildStorageUploadErrorMessage } from '../lib/supabaseStorageUploadError'
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

function logVideoUploadFailure(details: {
  status: number
  responseText: string
  bucket: string
  path: string
  contentType: string
  fileName: string
  fileSize: number
}): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.group('[video-upload] storage upload failed')
  console.log('bucket', details.bucket)
  console.log('path', details.path)
  console.log('contentType', details.contentType)
  console.log('fileName', details.fileName)
  console.log('fileSize', details.fileSize)
  console.log('httpStatus', details.status)
  console.log('responseText', details.responseText)
  console.groupEnd()
}

function uploadRawFileWithProgress(
  path: string,
  file: File,
  token: string,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const endpoint = getProductVideoUploadEndpoint(path)

    xhr.open('POST', endpoint)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', getSupabaseAnonKey())
    xhr.setRequestHeader('Content-Type', contentType)
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

      logVideoUploadFailure({
        status: xhr.status,
        responseText: xhr.responseText,
        bucket: PRODUCT_IMAGE_BUCKET,
        path,
        contentType,
        fileName: file.name,
        fileSize: file.size,
      })

      const message = buildStorageUploadErrorMessage(xhr.status, xhr.responseText)
      reject(new ProductImageUploadError(message, xhr.responseText))
    })

    xhr.addEventListener('error', () => {
      reject(
        new ProductImageUploadError(
          '업로드 실패\n네트워크 오류로 Storage에 연결하지 못했습니다.',
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
  await assertVideoFileSignature(file)

  const path = buildProductVideoPath(productId, file.name)
  const contentType = resolveProductVideoContentType(file)
  const token = await getAccessToken()

  if (import.meta.env.DEV) {
    console.log('[video-upload] stage=start', {
      fileName: file.name,
      mime: file.type || '(empty)',
      contentType,
      fileSize: file.size,
      productId,
    })
  }

  onProgress?.(5)
  await uploadRawFileWithProgress(path, file, token, contentType, (percent) => {
    onProgress?.(5 + Math.round(percent * 0.95))
  })

  if (import.meta.env.DEV) {
    console.log('[video-upload] stage=storage-ok', { path, contentType })
  }

  return getProductVideoPublicUrl(path)
}
