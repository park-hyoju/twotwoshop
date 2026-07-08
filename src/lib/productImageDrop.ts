import { filterAcceptedImageFiles, isAcceptedImageFile } from './productImageStorage'

export type ProductImageDropSource = 'files' | 'items' | 'html' | 'url' | 'none'

export interface ProductImageDropResult {
  files: File[]
  source: ProductImageDropSource
  reason?: string
}

export const KAKAO_DROP_HINT_MESSAGE =
  '카카오톡 직접 드래그는 제한될 수 있습니다. 사진을 바탕화면에 저장 후 끌어오면 바로 업로드됩니다.'

function logDropDebug(event: string, detail?: unknown) {
  if (import.meta.env.DEV) {
    console.log(`[product-image-drop] ${event}`, detail)
  }
}

export function isLikelyImageDrag(dataTransfer: DataTransfer): boolean {
  const types = Array.from(dataTransfer.types ?? [])

  return types.some((type) => {
    const normalized = type.toLowerCase()
    return (
      normalized === 'files' ||
      normalized === 'application/x-moz-file' ||
      normalized.includes('file') ||
      normalized === 'text/html' ||
      normalized === 'text/uri-list' ||
      normalized === 'text/plain' ||
      normalized === 'public.file-url'
    )
  })
}

function collectFilesFromList(fileList: FileList | null | undefined): File[] {
  if (!fileList || fileList.length === 0) {
    return []
  }

  return Array.from(fileList)
}

function collectFilesFromItems(dataTransfer: DataTransfer): File[] {
  const files: File[] = []

  if (!dataTransfer.items) {
    return files
  }

  for (let index = 0; index < dataTransfer.items.length; index += 1) {
    const item = dataTransfer.items[index]
    if (item.kind !== 'file') {
      continue
    }

    const file = item.getAsFile()
    if (file) {
      files.push(file)
    }
  }

  return files
}

export function extractImageSrcFromHtml(html: string): string | null {
  const trimmed = html.trim()
  if (!trimmed) {
    return null
  }

  const imgMatch = trimmed.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (imgMatch?.[1]) {
    return imgMatch[1]
  }

  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i)
  return srcMatch?.[1] ?? null
}

function extractUrlFromPlainText(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) {
    return null
  }

  const firstLine = trimmed.split(/\r?\n/).find((line) => line.trim().length > 0) ?? trimmed
  if (/^https?:\/\//i.test(firstLine) || /^file:\/\//i.test(firstLine)) {
    return firstLine.trim()
  }

  return null
}

function buildFileNameFromUrl(url: string, mimeType: string): string {
  try {
    const pathname = new URL(url).pathname
    const baseName = pathname.split('/').pop()
    if (baseName && /\.(jpe?g|png|webp)$/i.test(baseName)) {
      return baseName
    }
  } catch {
    // ignore
  }

  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg'
  return `dropped-image.${extension}`
}

export async function fetchImageUrlAsFile(url: string): Promise<File> {
  if (url.startsWith('file:')) {
    throw new Error('file-protocol')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`http-${response.status}`)
  }

  const blob = await response.blob()
  if (!blob.type.startsWith('image/') && !isAcceptedImageFile(new File([blob], 'image.jpg'))) {
    throw new Error('not-image')
  }

  const mimeType = blob.type || 'image/jpeg'
  return new File([blob], buildFileNameFromUrl(url, mimeType), { type: mimeType })
}

async function extractFilesFromHtmlOrText(
  dataTransfer: DataTransfer,
): Promise<{ files: File[]; source: 'html' | 'url' | 'none' }> {
  const html = dataTransfer.getData('text/html')
  const htmlSrc = html ? extractImageSrcFromHtml(html) : null

  if (htmlSrc) {
    logDropDebug('html:src', htmlSrc)
    try {
      return { files: [await fetchImageUrlAsFile(htmlSrc)], source: 'html' }
    } catch (error) {
      logDropDebug('html:fetch-failed', { htmlSrc, error })
    }
  }

  const plain = dataTransfer.getData('text/plain')
  const plainUrl = plain ? extractUrlFromPlainText(plain) : null

  if (plainUrl) {
    logDropDebug('text:url', plainUrl)
    try {
      return { files: [await fetchImageUrlAsFile(plainUrl)], source: 'url' }
    } catch (error) {
      logDropDebug('text:fetch-failed', { plainUrl, error })
    }
  }

  const uriList = dataTransfer.getData('text/uri-list')
  const uriUrl = uriList ? extractUrlFromPlainText(uriList) : null

  if (uriUrl) {
    logDropDebug('uri-list:url', uriUrl)
    try {
      return { files: [await fetchImageUrlAsFile(uriUrl)], source: 'url' }
    } catch (error) {
      logDropDebug('uri-list:fetch-failed', { uriUrl, error })
    }
  }

  return { files: [], source: 'none' }
}

/** drop 이벤트의 dataTransfer에서 이미지 File 목록 추출. */
export async function extractImagesFromDataTransfer(
  dataTransfer: DataTransfer,
): Promise<ProductImageDropResult> {
  const types = Array.from(dataTransfer.types ?? [])
  const filesLength = dataTransfer.files?.length ?? 0
  const itemsLength = dataTransfer.items?.length ?? 0

  logDropDebug('drop:inspect', { types, filesLength, itemsLength })

  const fromFiles = collectFilesFromList(dataTransfer.files)
  if (fromFiles.length > 0) {
    const accepted = filterAcceptedImageFiles(fromFiles)
    logDropDebug('drop:files', {
      raw: fromFiles.map((file) => ({ name: file.name, type: file.type, size: file.size })),
      accepted: accepted.length,
    })

    if (accepted.length > 0) {
      return { files: accepted, source: 'files' }
    }

    return {
      files: [],
      source: 'files',
      reason: '허용되지 않는 형식의 파일입니다. JPG, PNG, WEBP만 업로드할 수 있습니다.',
    }
  }

  const fromItems = collectFilesFromItems(dataTransfer)
  if (fromItems.length > 0) {
    const accepted = filterAcceptedImageFiles(fromItems)
    logDropDebug('drop:items', {
      raw: fromItems.map((file) => ({ name: file.name, type: file.type, size: file.size })),
      accepted: accepted.length,
    })

    if (accepted.length > 0) {
      return { files: accepted, source: 'items' }
    }

    return {
      files: [],
      source: 'items',
      reason: '허용되지 않는 형식의 파일입니다. JPG, PNG, WEBP만 업로드할 수 있습니다.',
    }
  }

  const fromHtmlOrUrl = await extractFilesFromHtmlOrText(dataTransfer)
  if (fromHtmlOrUrl.files.length > 0) {
    const accepted = filterAcceptedImageFiles(fromHtmlOrUrl.files)
    logDropDebug('drop:html-or-url', { accepted: accepted.length, source: fromHtmlOrUrl.source })

    if (accepted.length > 0) {
      return { files: accepted, source: fromHtmlOrUrl.source }
    }
  }

  logDropDebug('drop:failed', { types, filesLength, itemsLength })
  return {
    files: [],
    source: 'none',
    reason: KAKAO_DROP_HINT_MESSAGE,
  }
}
