import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { getCroppedImageFile } from '../../../lib/cropImage'

export type ProductCropAspect = '1:1' | '4:5'

/** Cropper `aspect` prop values. 4:5 = width/height = 0.8 */
export const PRODUCT_CROP_ASPECT_MAP: Record<ProductCropAspect, number> = {
  '1:1': 1,
  '4:5': 4 / 5,
}

interface ProductImageCropModalProps {
  isOpen: boolean
  imageSrc: string
  fileName: string
  initialAspect?: ProductCropAspect
  onClose: () => void
  onComplete: (file: File) => void
  onUseOriginal: (file: File) => void
}

export function ProductImageCropModal({
  isOpen,
  imageSrc,
  fileName,
  initialAspect = '1:1',
  onClose,
  onComplete,
  onUseOriginal,
}: ProductImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [aspectKey, setAspectKey] = useState<ProductCropAspect>(initialAspect)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const aspect = PRODUCT_CROP_ASPECT_MAP[aspectKey]

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setAspectKey(initialAspect)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    setErrorMessage(null)
    setIsProcessing(false)
  }, [isOpen, imageSrc, initialAspect])

  const syncCroppedArea = useCallback((_area: Area, pixels: Area) => {
    if (pixels.width > 0 && pixels.height > 0) {
      setCroppedAreaPixels(pixels)
    }
  }, [])

  if (!isOpen) {
    return null
  }

  function selectAspect(next: ProductCropAspect) {
    if (next === aspectKey) {
      return
    }

    setAspectKey(next)
    setCrop({ x: 0, y: 0 })
    setCroppedAreaPixels(null)
    setErrorMessage(null)
  }

  function rotate90() {
    setRotation((current) => (current + 90) % 360)
    setCroppedAreaPixels(null)
  }

  async function handleCropConfirm() {
    if (!croppedAreaPixels) {
      setErrorMessage('자르기 영역을 조정해 주세요.')
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // croppedAreaPixels는 현재 aspectKey에 맞는 Cropper 영역이며,
      // getCroppedImageFile은 그 width/height로 canvas를 만들어 선택 비율을 유지한다.
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, fileName, rotation)
      onComplete(file)
    } catch {
      setErrorMessage('이미지 자르기에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleUseOriginal() {
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const response = await fetch(imageSrc)
      const blob = await response.blob()
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' })
      onUseOriginal(file)
    } catch {
      setErrorMessage('원본 이미지를 사용하지 못했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-crop-title"
        className="flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="border-b border-neutral-200 px-5 py-4">
          <h2 id="product-crop-title" className="text-lg font-bold text-neutral-900">
            이미지 편집
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            드래그·핀치로 위치와 크기를 조정하고, 필요하면 회전하세요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-neutral-100 px-5 py-3">
          {(['1:1', '4:5'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => selectAspect(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                aspectKey === key
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {key === '1:1' ? '1:1 썸네일' : '4:5 착용샷'}
            </button>
          ))}
          <button
            type="button"
            onClick={rotate90}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-700"
          >
            90° 회전
          </button>
        </div>

        <div className="relative h-64 bg-neutral-900 sm:h-80">
          <Cropper
            key={`cropper-${aspectKey}-${rotation}`}
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={syncCroppedArea}
            onCropAreaChange={syncCroppedArea}
          />
        </div>

        <div className="space-y-3 px-5 py-4">
          <label className="block text-sm font-medium text-neutral-700">
            확대/축소
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>

          {errorMessage && (
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleUseOriginal()}
            disabled={isProcessing}
            className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700"
          >
            원본 그대로 사용
          </button>
          <button
            type="button"
            onClick={() => void handleCropConfirm()}
            disabled={isProcessing}
            className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {isProcessing ? '처리 중...' : '자르기 완료'}
          </button>
        </div>
      </div>
    </div>
  )
}
