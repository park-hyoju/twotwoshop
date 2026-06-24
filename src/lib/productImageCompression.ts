const MAX_LONG_EDGE_PX = 1600
const OUTPUT_QUALITY = 0.82

interface OutputFormat {
  mimeType: 'image/webp' | 'image/jpeg'
  extension: 'webp' | 'jpg'
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('이미지를 불러오지 못했습니다.'))
    }

    image.src = objectUrl
  })
}

function getOutputFormat(): OutputFormat {
  const canvas = document.createElement('canvas')
  const supportsWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp')

  if (supportsWebp) {
    return { mimeType: 'image/webp', extension: 'webp' }
  }

  return { mimeType: 'image/jpeg', extension: 'jpg' }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: OutputFormat['mimeType'],
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('이미지 압축에 실패했습니다.'))
      },
      mimeType,
      quality,
    )
  })
}

function getCompressedDimensions(width: number, height: number): { width: number; height: number } {
  const longEdge = Math.max(width, height)

  if (longEdge <= MAX_LONG_EDGE_PX) {
    return { width, height }
  }

  const scale = MAX_LONG_EDGE_PX / longEdge

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function buildCompressedFileName(originalName: string, extension: OutputFormat['extension']): string {
  const baseName = originalName.replace(/\.[^.]+$/, '').trim() || 'image'
  return `${baseName}.${extension}`
}

export async function compressProductImage(file: File): Promise<File> {
  const image = await loadImageFromFile(file)
  const { width, height } = getCompressedDimensions(image.naturalWidth, image.naturalHeight)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('이미지 압축을 준비하지 못했습니다.')
  }

  context.drawImage(image, 0, 0, width, height)

  const outputFormat = getOutputFormat()
  const blob = await canvasToBlob(canvas, outputFormat.mimeType, OUTPUT_QUALITY)

  return new File([blob], buildCompressedFileName(file.name, outputFormat.extension), {
    type: outputFormat.mimeType,
    lastModified: Date.now(),
  })
}
