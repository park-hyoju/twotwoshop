import { assertAdminRepositoryAccess } from '../lib/adminRepositoryGuard'
import { supabase } from '../lib/supabase'
import { compressProductImage } from '../lib/productImageCompression'
import {
  BANNER_IMAGE_BUCKET,
  buildBannerImagePath,
  extractBannerImageStoragePath,
  getBannerImagePublicUrl,
  getBannerImageUploadEndpoint,
  getSupabaseAnonKeyForBannerUpload,
} from '../lib/bannerImageStorage'
import { validateProductImageFile } from '../lib/productImageStorage'

export class BannerImageUploadError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'BannerImageUploadError'
    this.cause = cause
  }
}

async function getAccessToken(): Promise<string> {
  await assertAdminRepositoryAccess(BannerImageUploadError)

  const { data, error } = await supabase!.auth.getSession()
  if (error) {
    throw new BannerImageUploadError('로그인 세션을 확인하지 못했습니다.', error)
  }

  const token = data.session?.access_token
  if (!token) {
    throw new BannerImageUploadError('로그인이 필요합니다. 관리자 계정으로 다시 로그인해주세요.')
  }

  return token
}

function uploadFileWithProgress(
  path: string,
  file: File,
  token: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const endpoint = getBannerImageUploadEndpoint(path)

    xhr.open('POST', endpoint)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', getSupabaseAnonKeyForBannerUpload())
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

      let message = '이미지 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      if (xhr.status === 401 || xhr.status === 403) {
        message =
          '이미지 업로드 권한이 없습니다. 관리자 로그인 상태와 Storage 정책(banner-images-storage.sql)을 확인해 주세요.'
      } else if (xhr.status === 413) {
        message = '이미지 용량이 너무 큽니다. 다른 사진으로 다시 시도해 주세요.'
      }

      reject(new BannerImageUploadError(message, xhr.responseText))
    })

    xhr.addEventListener('error', () => {
      reject(
        new BannerImageUploadError(
          '네트워크 오류로 이미지를 업로드하지 못했습니다. 연결 상태를 확인해 주세요.',
        ),
      )
    })

    xhr.send(file)
  })
}

export async function uploadBannerImage(
  bannerId: string,
  file: File,
  role: 'desktop' | 'mobile',
  onProgress?: (percent: number) => void,
): Promise<string> {
  try {
    validateProductImageFile(file)
  } catch (error) {
    if (error instanceof Error) {
      throw new BannerImageUploadError(error.message, error)
    }
    throw new BannerImageUploadError('이미지를 업로드할 수 없습니다.', error)
  }

  let uploadFile: File

  try {
    onProgress?.(5)
    uploadFile = await compressProductImage(file)
  } catch (error) {
    throw new BannerImageUploadError(
      '이미지를 자동 최적화하는 중 문제가 생겼어요. 다른 사진으로 다시 시도해 주세요.',
      error,
    )
  }

  const path = buildBannerImagePath(bannerId, role, uploadFile.name)
  const token = await getAccessToken()

  onProgress?.(10)
  await uploadFileWithProgress(path, uploadFile, token, (percent) => {
    onProgress?.(10 + Math.round(percent * 0.9))
  })

  return getBannerImagePublicUrl(path)
}

export async function deleteBannerImageByUrl(url: string): Promise<void> {
  const path = extractBannerImageStoragePath(url)
  if (!path) {
    return
  }

  await assertAdminRepositoryAccess(BannerImageUploadError)

  const { error } = await supabase!.storage.from(BANNER_IMAGE_BUCKET).remove([path])
  if (error) {
    console.warn('[banner-image] storage delete failed', { path, error })
  }
}
