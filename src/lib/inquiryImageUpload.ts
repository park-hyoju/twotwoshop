const INQUIRY_IMAGE_BUCKET = 'customer-inquiry-images'
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_IMAGES = 3
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_DIMENSION = 1920

export const INQUIRY_IMAGE_LIMITS = {
  maxFiles: MAX_IMAGES,
  maxFileSize: MAX_FILE_SIZE,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
}

function getFileExtension(file: File): string {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('IMAGE_LOAD_FAILED'))
    }

    image.src = url
  })
}

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= 2 * 1024 * 1024) {
    return file
  }

  const image = await loadImage(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    return file
  }

  context.drawImage(image, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85)
  })

  if (!blob) {
    return file
  }

  return new File([blob], file.name, { type: blob.type })
}

export function validateInquiryImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'JPG, PNG, WEBP 이미지만 첨부할 수 있습니다.'
  }

  if (file.size > MAX_FILE_SIZE) {
    return '이미지는 최대 10MB까지 첨부할 수 있습니다.'
  }

  return null
}

export async function uploadInquiryImages(files: File[]): Promise<string[]> {
  const { isSupabaseConfigured, supabase } = await import('./supabase')

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('이미지 업로드를 일시적으로 이용할 수 없습니다.')
  }

  if (files.length > MAX_IMAGES) {
    throw new Error(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`)
  }

  const sessionId = crypto.randomUUID()
  const uploadedUrls: string[] = []

  for (const originalFile of files) {
    const validationError = validateInquiryImageFile(originalFile)
    if (validationError) {
      throw new Error(validationError)
    }

    const file = await compressImage(originalFile)
    const path = `pending/${sessionId}/${Date.now()}-${crypto.randomUUID()}.${getFileExtension(file)}`

    const { error } = await supabase.storage.from(INQUIRY_IMAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

    if (error) {
      throw new Error('이미지 업로드에 실패했습니다.')
    }

    const { data } = supabase.storage.from(INQUIRY_IMAGE_BUCKET).getPublicUrl(path)
    uploadedUrls.push(data.publicUrl)
  }

  return uploadedUrls
}
