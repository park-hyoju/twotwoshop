import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  extractImagesFromDataTransfer,
  isLikelyImageDrag,
  KAKAO_DROP_HINT_MESSAGE,
} from '../../../lib/productImageDrop'
import { filterAcceptedImageFiles, PRODUCT_IMAGE_ACCEPT } from '../../../lib/productImageStorage'
import { prepareProductImageFile } from '../../../lib/productImagePrepare'
import {
  ProductImageUploadError,
  uploadProductImage,
} from '../../../services/adminProductImageUploadService'
import type { AdminProductFormFiles } from '../../../types/adminProduct'
import { useAdminToast } from '../AdminToast'
import { ProductImageCropModal, type ProductCropAspect } from './ProductImageCropModal'

export type ProductGalleryImageStatus =
  | 'pending'
  | 'cropping'
  | 'processing'
  | 'uploading'
  | 'done'
  | 'error'

export interface ProductGalleryImage {
  id: string
  previewUrl: string
  file: File | null
  remoteUrl: string | null
  status: ProductGalleryImageStatus
  progress: number
  errorMessage: string | null
  sourceFileName: string
  sizeWarning: boolean
}

interface ProductImageGalleryManagerProps {
  images: ProductGalleryImage[]
  onChange: (updater: (current: ProductGalleryImage[]) => ProductGalleryImage[]) => void
  productId: string | null
  disabled?: boolean
  required?: boolean
}

interface CropTarget {
  imageId: string
  src: string
  fileName: string
  aspect: ProductCropAspect
  pendingFile?: File
}

let galleryImageIdCounter = 0

function createGalleryImageId(): string {
  galleryImageIdCounter += 1
  return `gallery-${Date.now()}-${galleryImageIdCounter}`
}

function revokeBlobUrl(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

function logGalleryEvent(event: string, detail?: unknown) {
  if (import.meta.env.DEV) {
    console.log(`[product-image-gallery] ${event}`, detail)
  }
}

export function isGalleryImageDone(image: ProductGalleryImage): boolean {
  return image.status === 'done'
}

export function isGalleryImageBusy(image: ProductGalleryImage): boolean {
  return (
    image.status === 'pending' ||
    image.status === 'cropping' ||
    image.status === 'processing' ||
    image.status === 'uploading'
  )
}

export function hasDoneGalleryImage(images: ProductGalleryImage[]): boolean {
  return images.some(isGalleryImageDone)
}

function isGalleryImageUsable(image: ProductGalleryImage): boolean {
  return isGalleryImageDone(image)
}

export function buildAdminProductFormFiles(images: ProductGalleryImage[]): AdminProductFormFiles {
  const ordered = images.filter(isGalleryImageUsable)

  if (ordered.length === 0) {
    return {
      thumbnail: null,
      additionalImages: [],
      retainedAdditionalUrls: [],
      existingThumbnailUrl: null,
    }
  }

  const [main, ...rest] = ordered

  return {
    thumbnail: main.file,
    existingThumbnailUrl: main.file ? null : main.remoteUrl ?? main.previewUrl,
    additionalImages: rest.filter((image) => image.file !== null).map((image) => image.file!),
    retainedAdditionalUrls: rest
      .filter((image) => image.file === null)
      .map((image) => image.remoteUrl ?? image.previewUrl),
  }
}

export function galleryImagesFromUrls(urls: string[]): ProductGalleryImage[] {
  return urls.map((url) => ({
    id: createGalleryImageId(),
    previewUrl: url,
    file: null,
    remoteUrl: url,
    status: 'done',
    progress: 100,
    errorMessage: null,
    sourceFileName: 'existing-image.jpg',
    sizeWarning: false,
  }))
}

function statusLabel(status: ProductGalleryImageStatus): string {
  switch (status) {
    case 'pending':
      return '대기 중'
    case 'cropping':
      return '자르기 중'
    case 'processing':
      return '처리 중'
    case 'uploading':
      return '업로드 중'
    case 'done':
      return '완료'
    case 'error':
      return '업로드 실패'
    default:
      return status
  }
}

function StatusBadge({ image }: { image: ProductGalleryImage }) {
  const tone =
    image.status === 'done'
      ? 'bg-emerald-100 text-emerald-800'
      : image.status === 'error'
        ? 'bg-red-100 text-red-700'
        : 'bg-blue-100 text-blue-800'

  const progressSuffix =
    image.status === 'processing' || image.status === 'uploading'
      ? ` ${image.progress}%`
      : ''

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>
      {statusLabel(image.status)}
      {progressSuffix}
    </span>
  )
}

export function ProductImageGalleryManager({
  images,
  onChange,
  productId,
  disabled = false,
  required = false,
}: ProductImageGalleryManagerProps) {
  const { showToast } = useAdminToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const imagesRef = useRef(images)
  const cancelledIdsRef = useRef(new Set<string>())
  const [isDragging, setIsDragging] = useState(false)
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null)
  const [dragReorderIndex, setDragReorderIndex] = useState<number | null>(null)
  const [isDropProcessing, setIsDropProcessing] = useState(false)
  const dropZoneId = useId()

  imagesRef.current = images

  const patchImage = useCallback(
    (imageId: string, patch: Partial<ProductGalleryImage>) => {
      if (cancelledIdsRef.current.has(imageId)) {
        return
      }

      onChange((current) =>
        current.map((image) => (image.id === imageId ? { ...image, ...patch } : image)),
      )
    },
    [onChange],
  )

  const isCancelled = useCallback((imageId: string) => cancelledIdsRef.current.has(imageId), [])

  const markError = useCallback(
    (imageId: string, message: string, file: File | null = null) => {
      logGalleryEvent('error', { imageId, message })
      patchImage(imageId, {
        status: 'error',
        progress: 0,
        errorMessage: message,
        file,
      })
      showToast(message, { durationMs: 4000 })
    },
    [patchImage, showToast],
  )

  const markDone = useCallback(
    (imageId: string, payload: {
      previewUrl: string
      file: File | null
      remoteUrl: string | null
      sourceFileName: string
      sizeWarning?: boolean
    }) => {
      logGalleryEvent('done', {
        imageId,
        remoteUrl: payload.remoteUrl,
        previewUrl: payload.previewUrl,
        hasFile: Boolean(payload.file),
      })

      patchImage(imageId, {
        status: 'done',
        progress: 100,
        previewUrl: payload.previewUrl,
        file: payload.file,
        remoteUrl: payload.remoteUrl,
        sourceFileName: payload.sourceFileName,
        sizeWarning: payload.sizeWarning ?? false,
        errorMessage: null,
      })
    },
    [patchImage],
  )

  const uploadToStorage = useCallback(
    async (imageId: string, file: File): Promise<void> => {
      if (isCancelled(imageId)) {
        return
      }

      if (!productId) {
        const previewUrl = URL.createObjectURL(file)
        const current = imagesRef.current.find((item) => item.id === imageId)
        if (current?.previewUrl.startsWith('blob:') && current.previewUrl !== previewUrl) {
          revokeBlobUrl(current.previewUrl)
        }

        markDone(imageId, {
          previewUrl,
          file,
          remoteUrl: null,
          sourceFileName: file.name,
        })
        return
      }

      patchImage(imageId, { status: 'uploading', progress: 0, errorMessage: null })
      logGalleryEvent('storage:upload:start', { imageId, productId })

      try {
        const role =
          imagesRef.current.findIndex((item) => item.id === imageId) === 0 ? 'thumbnail' : 'detail'

        const url = await uploadProductImage(productId, file, role, (percent) => {
          if (!isCancelled(imageId)) {
            patchImage(imageId, { progress: percent })
          }
        })

        if (isCancelled(imageId)) {
          return
        }

        logGalleryEvent('storage:upload:complete', { imageId, url })

        const current = imagesRef.current.find((item) => item.id === imageId)
        if (current?.previewUrl.startsWith('blob:')) {
          revokeBlobUrl(current.previewUrl)
        }

        markDone(imageId, {
          previewUrl: url,
          file: null,
          remoteUrl: url,
          sourceFileName: file.name,
        })
      } catch (error) {
        if (isCancelled(imageId)) {
          return
        }

        const message =
          error instanceof ProductImageUploadError
            ? error.message
            : '이미지 업로드에 실패했습니다.'

        markError(imageId, message, file)
      }
    },
    [isCancelled, markDone, markError, patchImage, productId],
  )

  const processFile = useCallback(
    async (imageId: string, file: File, previewUrl: string) => {
      if (isCancelled(imageId)) {
        return
      }

      patchImage(imageId, {
        status: 'processing',
        progress: 0,
        errorMessage: null,
        previewUrl,
        file: null,
      })

      logGalleryEvent('processing:start', { imageId, name: file.name })

      try {
        const result = await prepareProductImageFile(file, (percent) => {
          if (!isCancelled(imageId)) {
            patchImage(imageId, { progress: percent })
          }
        })

        if (isCancelled(imageId)) {
          return
        }

        logGalleryEvent('processing:complete', { imageId, name: result.file.name })

        const nextPreview = URL.createObjectURL(result.file)
        if (previewUrl.startsWith('blob:') && previewUrl !== nextPreview) {
          revokeBlobUrl(previewUrl)
        }

        patchImage(imageId, {
          previewUrl: nextPreview,
          file: result.file,
          sizeWarning: result.sizeWarning,
          sourceFileName: result.file.name,
        })

        await uploadToStorage(imageId, result.file)
      } catch (error) {
        if (isCancelled(imageId)) {
          return
        }

        const message = error instanceof Error ? error.message : '이미지 처리에 실패했습니다.'
        markError(imageId, message, file)
      }
    },
    [isCancelled, markError, patchImage, uploadToStorage],
  )

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const accepted = filterAcceptedImageFiles(Array.from(fileList))
      if (accepted.length === 0) {
        logGalleryEvent('files:rejected', { rawCount: Array.from(fileList).length })
        return 0
      }

      logGalleryEvent('files:received', {
        count: accepted.length,
        names: accepted.map((file) => file.name),
      })

      const isFirstGallery = imagesRef.current.length === 0

      if (isFirstGallery) {
        const [first, ...rest] = accepted
        const imageId = createGalleryImageId()
        const previewUrl = URL.createObjectURL(first)

        logGalleryEvent('preview:created', { imageId, previewUrl })

        const newItem: ProductGalleryImage = {
          id: imageId,
          previewUrl,
          file: null,
          remoteUrl: null,
          status: 'cropping',
          progress: 0,
          errorMessage: null,
          sourceFileName: first.name,
          sizeWarning: first.size >= 10 * 1024 * 1024,
        }

        onChange((current) => [...current, newItem])
        setCropTarget({
          imageId,
          src: previewUrl,
          fileName: first.name,
          aspect: '1:1',
          pendingFile: first,
        })

        logGalleryEvent('crop:start', { imageId })

        if (rest.length > 0) {
          const restItems: ProductGalleryImage[] = rest.map((file) => {
            const id = createGalleryImageId()
            const url = URL.createObjectURL(file)
            logGalleryEvent('preview:created', { imageId: id, previewUrl: url })
            return {
              id,
              previewUrl: url,
              file: null,
              remoteUrl: null,
              status: 'pending' as const,
              progress: 0,
              errorMessage: null,
              sourceFileName: file.name,
              sizeWarning: file.size >= 10 * 1024 * 1024,
            }
          })

          onChange((current) => [...current, ...restItems])

          for (const item of restItems) {
            const sourceFile = rest.find((file) => file.name === item.sourceFileName)
            if (!sourceFile) continue
            void processFile(item.id, sourceFile, item.previewUrl)
          }
        }

        return accepted.length
      }

      const newItems: ProductGalleryImage[] = accepted.map((file) => {
        const id = createGalleryImageId()
        const url = URL.createObjectURL(file)
        logGalleryEvent('preview:created', { imageId: id, previewUrl: url })
        return {
          id,
          previewUrl: url,
          file: null,
          remoteUrl: null,
          status: 'pending' as const,
          progress: 0,
          errorMessage: null,
          sourceFileName: file.name,
          sizeWarning: file.size >= 10 * 1024 * 1024,
        }
      })

      onChange((current) => [...current, ...newItems])

      for (const item of newItems) {
        const sourceFile = accepted.find((file) => file.name === item.sourceFileName)
        if (!sourceFile) continue
        void processFile(item.id, sourceFile, item.previewUrl)
      }

      return accepted.length
    },
    [onChange, processFile],
  )

  useEffect(() => {
    function preventWindowDefaults(event: DragEvent) {
      event.preventDefault()
    }

    window.addEventListener('dragover', preventWindowDefaults)
    window.addEventListener('drop', preventWindowDefaults)

    return () => {
      window.removeEventListener('dragover', preventWindowDefaults)
      window.removeEventListener('drop', preventWindowDefaults)
    }
  }, [])

  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        revokeBlobUrl(image.previewUrl)
      }
    }
  }, [])

  function openFilePicker() {
    inputRef.current?.click()
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      addFiles(event.target.files)
    }
    event.target.value = ''
  }

  function handleDragEnter(event: React.DragEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (disabled) {
      return
    }

    dragCounterRef.current += 1

    if (isLikelyImageDrag(event.dataTransfer)) {
      setIsDragging(true)
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return
    }

    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (disabled) {
      return
    }

    event.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current = 0
    setIsDragging(false)

    if (disabled || isDropProcessing) {
      return
    }

    setIsDropProcessing(true)

    try {
      const result = await extractImagesFromDataTransfer(event.dataTransfer)

      if (result.files.length === 0) {
        const message = result.reason ?? KAKAO_DROP_HINT_MESSAGE
        showToast(message, { durationMs: 4500 })
        logGalleryEvent('drop:failed', { reason: message })
        return
      }

      const added = addFiles(result.files)
      if (added === 0) {
        showToast('JPG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.', { durationMs: 4000 })
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '이미지를 불러오지 못했습니다. 다시 시도해 주세요.'
      showToast(message, { durationMs: 4000 })
      logGalleryEvent('drop:error', error)
    } finally {
      setIsDropProcessing(false)
    }
  }

  function removeImage(imageId: string) {
    cancelledIdsRef.current.add(imageId)
    logGalleryEvent('remove', { imageId })

    onChange((current) => {
      const target = current.find((image) => image.id === imageId)
      if (target) {
        revokeBlobUrl(target.previewUrl)
      }
      return current.filter((image) => image.id !== imageId)
    })

    if (cropTarget?.imageId === imageId) {
      setCropTarget(null)
    }
  }

  function setAsMain(imageId: string) {
    onChange((current) => {
      const index = current.findIndex((image) => image.id === imageId)
      if (index <= 0) {
        return current
      }

      const copy = [...current]
      const [item] = copy.splice(index, 1)
      copy.unshift(item)
      return copy
    })
  }

  function moveImage(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return
    }

    onChange((current) => {
      const copy = [...current]
      const [item] = copy.splice(fromIndex, 1)
      copy.splice(toIndex, 0, item)
      return copy
    })
  }

  function openCrop(image: ProductGalleryImage, aspect: ProductCropAspect) {
    logGalleryEvent('crop:start', { imageId: image.id })
    patchImage(image.id, { status: 'cropping', errorMessage: null })
    setCropTarget({
      imageId: image.id,
      src: image.previewUrl,
      fileName: image.sourceFileName,
      aspect,
    })
  }

  async function applyCroppedFile(imageId: string, file: File) {
    if (isCancelled(imageId)) {
      return
    }

    logGalleryEvent('crop:complete', { imageId, name: file.name })

    const current = imagesRef.current.find((image) => image.id === imageId)
    if (current?.previewUrl.startsWith('blob:')) {
      revokeBlobUrl(current.previewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    logGalleryEvent('preview:created', { imageId, previewUrl })

    patchImage(imageId, {
      previewUrl,
      file,
      remoteUrl: null,
      sourceFileName: file.name,
      sizeWarning: false,
      status: 'processing',
      progress: 0,
      errorMessage: null,
    })

    try {
      const result = await prepareProductImageFile(file, (percent) => {
        if (!isCancelled(imageId)) {
          patchImage(imageId, { progress: percent })
        }
      })

      if (isCancelled(imageId)) {
        return
      }

      const nextPreview = URL.createObjectURL(result.file)
      if (previewUrl.startsWith('blob:')) {
        revokeBlobUrl(previewUrl)
      }

      patchImage(imageId, {
        previewUrl: nextPreview,
        file: result.file,
        sizeWarning: result.sizeWarning,
        sourceFileName: result.file.name,
      })

      await uploadToStorage(imageId, result.file)
    } catch (error) {
      if (isCancelled(imageId)) {
        return
      }

      const message = error instanceof Error ? error.message : '이미지 처리에 실패했습니다.'
      markError(imageId, message, file)
    }
  }

  function retryImage(image: ProductGalleryImage) {
    cancelledIdsRef.current.delete(image.id)
    logGalleryEvent('retry', { imageId: image.id })

    if (image.file) {
      void uploadToStorage(image.id, image.file)
      return
    }

    void (async () => {
      try {
        const response = await fetch(image.previewUrl)
        const blob = await response.blob()
        const file = new File([blob], image.sourceFileName, { type: blob.type || 'image/jpeg' })
        await processFile(image.id, file, image.previewUrl)
      } catch {
        markError(
          image.id,
          '이미지를 다시 불러오지 못했습니다. 삭제 후 다시 추가해 주세요.',
        )
      }
    })()
  }

  function handleCropClose() {
    if (cropTarget?.pendingFile && !isCancelled(cropTarget.imageId)) {
      logGalleryEvent('crop:cancelled-use-original', { imageId: cropTarget.imageId })
      void processFile(cropTarget.imageId, cropTarget.pendingFile, cropTarget.src)
    }

    setCropTarget(null)
  }

  const isBusyOverlay = (status: ProductGalleryImageStatus) =>
    status === 'processing' || status === 'uploading' || status === 'pending'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-800">
          상품 이미지
          {required && <span className="ml-1 text-red-600">*</span>}
        </p>
        <p className="text-xs text-neutral-500">첫 번째 이미지가 대표 이미지입니다</p>
      </div>

      <div
        id={dropZoneId}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={(event) => void handleDrop(event)}
        onClick={() => {
          if (!disabled && !isDropProcessing) {
            openFilePicker()
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (!disabled) {
              openFilePicker()
            }
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="상품 이미지 업로드 영역"
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragging
            ? 'border-neutral-900 bg-neutral-100 ring-2 ring-neutral-900/20'
            : 'border-neutral-300 bg-neutral-50 hover:border-neutral-500 hover:bg-neutral-100'
        } ${disabled || isDropProcessing ? 'pointer-events-none opacity-50' : ''}`}
      >
        <div className="pointer-events-none mx-auto flex max-w-sm flex-col items-center gap-2">
          <span className="text-3xl" aria-hidden>
            📷
          </span>
          <p className="text-sm font-semibold text-neutral-900">사진을 여기로 끌어다 놓으세요</p>
          <p className="text-sm text-neutral-600">
            카카오톡에서 안 되면 사진을 바탕화면에 저장한 뒤 끌어오세요
          </p>
          <p className="text-sm text-neutral-600">또는 클릭해서 파일을 선택하세요</p>
          <p className="mt-1 text-xs text-neutral-500">JPG · PNG · WEBP · 여러 장 동시 가능</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              draggable={!disabled && image.status === 'done'}
              onDragStart={(event) => {
                event.stopPropagation()
                setDragReorderIndex(index)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onDrop={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (dragReorderIndex !== null) {
                  moveImage(dragReorderIndex, index)
                }
                setDragReorderIndex(null)
              }}
              onDragEnd={() => setDragReorderIndex(null)}
              className={`relative overflow-hidden rounded-xl border bg-white ${
                dragReorderIndex === index ? 'border-neutral-900 ring-2 ring-neutral-900/20' : 'border-neutral-200'
              }`}
            >
              <div className="relative aspect-square bg-neutral-100">
                <img
                  src={image.previewUrl}
                  alt=""
                  className={`h-full w-full object-cover ${isBusyOverlay(image.status) ? 'opacity-60' : ''}`}
                />

                {isBusyOverlay(image.status) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 px-2">
                    <div className="h-1.5 w-full max-w-[80%] overflow-hidden rounded-full bg-white/30">
                      <div
                        className="h-full rounded-full bg-white transition-all"
                        style={{ width: `${image.progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-white">
                      {statusLabel(image.status)}...
                    </p>
                  </div>
                )}

                {image.status === 'cropping' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 px-2">
                    <p className="text-[11px] font-semibold text-white">자르기 중...</p>
                  </div>
                )}

                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white">
                    대표
                  </span>
                )}

                {image.sizeWarning && (
                  <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    10MB+
                  </span>
                )}
              </div>

              <div className="space-y-2 p-2">
                <div className="flex flex-wrap items-center gap-1">
                  <StatusBadge image={image} />
                  {image.status === 'done' && (
                    <span className="text-[10px] text-neutral-400">⋮⋮ 순서 변경</span>
                  )}
                </div>

                {image.errorMessage && (
                  <p className="text-[10px] leading-snug text-red-600">{image.errorMessage}</p>
                )}

                <div className="flex flex-wrap gap-1">
                  {index !== 0 && image.status === 'done' && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(event) => {
                        event.stopPropagation()
                        setAsMain(image.id)
                      }}
                      className="rounded border border-neutral-300 px-2 py-1 text-[10px] font-semibold text-neutral-700"
                    >
                      대표로 설정
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={disabled || isGalleryImageBusy(image)}
                    onClick={(event) => {
                      event.stopPropagation()
                      openCrop(image, index === 0 ? '1:1' : '4:5')
                    }}
                    className="rounded border border-neutral-300 px-2 py-1 text-[10px] font-semibold text-neutral-700"
                  >
                    자르기
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(event) => {
                      event.stopPropagation()
                      removeImage(image.id)
                    }}
                    className="rounded border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-700"
                  >
                    삭제
                  </button>
                  {image.status === 'error' && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(event) => {
                        event.stopPropagation()
                        retryImage(image)
                      }}
                      className="rounded border border-blue-200 px-2 py-1 text-[10px] font-semibold text-blue-700"
                    >
                      다시 시도
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cropTarget && (
        <ProductImageCropModal
          isOpen
          imageSrc={cropTarget.src}
          fileName={cropTarget.fileName}
          initialAspect={cropTarget.aspect}
          onClose={handleCropClose}
          onComplete={(file) => {
            void applyCroppedFile(cropTarget.imageId, file)
            setCropTarget(null)
          }}
          onUseOriginal={(file) => {
            void applyCroppedFile(cropTarget.imageId, file)
            setCropTarget(null)
          }}
        />
      )}
    </div>
  )
}
