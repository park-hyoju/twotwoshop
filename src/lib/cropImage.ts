import type { Area } from 'react-easy-crop'

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

function getRadianAngle(degree: number): number {
  return (degree * Math.PI) / 180
}

function rotateSize(width: number, height: number, rotation: number) {
  const radians = getRadianAngle(rotation)
  return {
    width: Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
    height: Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
  }
}

export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName = 'cropped.jpg',
  rotation = 0,
): Promise<File> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('이미지를 자르지 못했습니다.')
  }

  const { width: boxWidth, height: boxHeight } = rotateSize(
    image.naturalWidth,
    image.naturalHeight,
    rotation,
  )

  canvas.width = boxWidth
  canvas.height = boxHeight

  context.translate(boxWidth / 2, boxHeight / 2)
  context.rotate(getRadianAngle(rotation))
  context.translate(-image.naturalWidth / 2, -image.naturalHeight / 2)
  context.drawImage(image, 0, 0)

  const croppedCanvas = document.createElement('canvas')
  const croppedContext = croppedCanvas.getContext('2d')

  if (!croppedContext) {
    throw new Error('이미지를 자르지 못했습니다.')
  }

  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height

  croppedContext.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  const blob = await new Promise<Blob>((resolve, reject) => {
    croppedCanvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('이미지를 자르지 못했습니다.'))
          return
        }
        resolve(result)
      },
      'image/jpeg',
      0.92,
    )
  })

  return new File([blob], fileName, { type: 'image/jpeg' })
}
