import { useEffect, useRef, useState } from 'react'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import { PRODUCT_IMAGE_ACCEPT } from '../../../../../lib/productImageStorage'
import {
  deleteProductImageByUrl,
  ProductImageUploadError,
  uploadProductImage,
} from '../../../../../services/adminProductImageUploadService'
import { isPlaceholderProductImage } from '../../../../../lib/productImageStorage'
import {
  collectGalleryPhotos,
  getDetailImagesFromForm,
  syncProductImagesToForm,
} from '../detailContent/detailContent'
import { ProductImageGalleryItem } from '../images/ProductImageGalleryItem'
import { ProductImageUploadZone } from '../images/ProductImageUploadZone'
import { UploadProgressBar } from '../images/UploadProgressBar'

interface ProductDetailImagesSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

interface UploadTask {
  id: string
  label: string
  progress: number
}

function getUploadErrorMessage(error: unknown): string {
  if (error instanceof ProductImageUploadError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return '사진 업로드에 실패했어요.'
}

export function ProductDetailImagesSection({ form, onChange }: ProductDetailImagesSectionProps) {
  const replaceRef = useRef<HTMLInputElement>(null)
  const [detailImages, setDetailImages] = useState<string[]>(() => getDetailImagesFromForm(form))
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const isUploading = uploadTasks.length > 0

  useEffect(() => {
    setDetailImages(getDetailImagesFromForm(form))
  }, [form.id])

  function applyDetailImages(nextImages: string[]) {
    setDetailImages(nextImages)
    syncProductImagesToForm(collectGalleryPhotos(form), nextImages, onChange)
  }

  function removeTask(taskId: string) {
    setUploadTasks((current) => current.filter((task) => task.id !== taskId))
  }

  async function runUpload(file: File, onComplete: (url: string) => void | Promise<void>) {
    const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setUploadTasks((current) => [...current, { id: taskId, label: file.name, progress: 0 }])
    setUploadError(null)

    try {
      const publicUrl = await uploadProductImage(form.id, file, 'detail', (progress) => {
        setUploadTasks((current) =>
          current.map((task) => (task.id === taskId ? { ...task, progress } : task)),
        )
      })
      await onComplete(publicUrl)
    } catch (error) {
      setUploadError(getUploadErrorMessage(error))
    } finally {
      removeTask(taskId)
    }
  }

  async function handleUpload(files: File[]) {
    let next = [...detailImages]
    for (const file of files) {
      await runUpload(file, (url) => {
        next = [...next, url]
        applyDetailImages(next)
      })
    }
  }

  async function handleReplace(files: FileList | null) {
    if (!files?.length || replaceIndex === null) {
      return
    }

    const index = replaceIndex
    const previous = detailImages[index]
    await runUpload(files[0], async (url) => {
      const next = [...detailImages]
      next[index] = url
      applyDetailImages(next)
      if (previous && !isPlaceholderProductImage(previous)) {
        await deleteProductImageByUrl(previous)
      }
    })
    setReplaceIndex(null)
  }

  async function removeImage(index: number) {
    const previous = detailImages[index]
    applyDetailImages(detailImages.filter((_, i) => i !== index))
    if (previous && !isPlaceholderProductImage(previous)) {
      await deleteProductImageByUrl(previous)
    }
  }

  function reorderImages(from: number, to: number) {
    if (from === to) {
      return
    }
    const next = [...detailImages]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    applyDetailImages(next)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500">
        상세 페이지에 위에서 아래 순서로 보여져요. 원하는 만큼 추가할 수 있어요.
      </p>

      <input
        ref={replaceRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        className="absolute h-0 w-0 opacity-0"
        disabled={isUploading}
        onChange={(event) => {
          void handleReplace(event.target.files)
          event.target.value = ''
        }}
      />

      {uploadError && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {uploadError}
        </p>
      )}

      {uploadTasks.length > 0 && (
        <div className="space-y-2">
          {uploadTasks.map((task) => (
            <UploadProgressBar key={task.id} label={task.label} progress={task.progress} />
          ))}
        </div>
      )}

      <ProductImageUploadZone
        title="상세 이미지 추가"
        description="드래그하거나 클릭해서 여러 장 올리기"
        multiple
        compact={detailImages.length > 0}
        disabled={isUploading}
        onFilesSelected={(files) => void handleUpload(files)}
      />

      {detailImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {detailImages.map((image, index) => (
            <ProductImageGalleryItem
              key={`${image}-${index}`}
              imageUrl={image}
              index={index}
              isPrimary={false}
              isDragging={dragIndex === index}
              isDropTarget={dropIndex === index && dragIndex !== index}
              disabled={isUploading}
              onDragStart={setDragIndex}
              onDragOver={setDropIndex}
              onDrop={(to) => {
                if (dragIndex !== null) {
                  reorderImages(dragIndex, to)
                }
                setDragIndex(null)
                setDropIndex(null)
              }}
              onDragEnd={() => {
                setDragIndex(null)
                setDropIndex(null)
              }}
              onSetPrimary={() => undefined}
              onReplace={(i) => {
                setReplaceIndex(i)
                replaceRef.current?.click()
              }}
              onDelete={(i) => void removeImage(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
