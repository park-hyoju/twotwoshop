import { useRef, useState } from 'react'
import type { AdminProductDetailForm } from '../../../../types/adminProductDetail'
import { PRODUCT_IMAGE_ACCEPT, isPlaceholderProductImage } from '../../../../lib/productImageStorage'
import {
  deleteProductImageByUrl,
  ProductImageUploadError,
  uploadProductImage,
} from '../../../../services/adminProductImageUploadService'
import {
  collectGalleryPhotos,
  getDetailImagesFromForm,
  syncProductImagesToForm,
} from './detailContent/detailContent'
import { ProductImageGalleryItem } from './images/ProductImageGalleryItem'
import { ProductImageUploadZone } from './images/ProductImageUploadZone'
import { UploadProgressBar } from './images/UploadProgressBar'

interface ImagesTabProps {
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

  return '사진 업로드 중 문제가 생겼어요. 다시 시도해 주세요.'
}

function applyGalleryPhotos(
  photos: string[],
  form: AdminProductDetailForm,
  onChange: ImagesTabProps['onChange'],
) {
  syncProductImagesToForm(photos, getDetailImagesFromForm(form), onChange)
}

export function ImagesTab({ form, onChange }: ImagesTabProps) {
  const replaceRef = useRef<HTMLInputElement>(null)
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null)

  const isUploading = uploadTasks.length > 0
  const photos = collectGalleryPhotos(form)
  const hasPhotos = photos.length > 0

  function markUploadPreparing() {
    setUploadError(null)
    setUploadSuccessMessage(null)
  }

  function markUploadRejected(message: string) {
    setUploadError(message)
  }

  function updateTaskProgress(taskId: string, progress: number) {
    setUploadTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, progress } : task)),
    )
  }

  function removeTask(taskId: string) {
    setUploadTasks((current) => current.filter((task) => task.id !== taskId))
  }

  async function runUpload(
    file: File,
    role: 'thumbnail' | 'detail',
    onComplete: (publicUrl: string) => void | Promise<void>,
  ) {
    const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setUploadTasks((current) => [...current, { id: taskId, label: file.name, progress: 0 }])
    setUploadError(null)
    setUploadSuccessMessage(null)

    try {
      const publicUrl = await uploadProductImage(form.id, file, role, (progress) => {
        updateTaskProgress(taskId, progress)
      })
      await onComplete(publicUrl)
      setUploadSuccessMessage('사진이 추가됐어요. 저장 버튼을 눌러 반영해 주세요.')
    } catch (error) {
      setUploadError(getUploadErrorMessage(error))
    } finally {
      removeTask(taskId)
    }
  }

  async function handleUpload(files: File[]) {
    let nextPhotos = [...photos]

    for (const file of files) {
      const role = nextPhotos.length === 0 ? 'thumbnail' : 'detail'
      await runUpload(file, role, (publicUrl) => {
        nextPhotos = [...nextPhotos, publicUrl]
        applyGalleryPhotos(nextPhotos, form, onChange)
      })
    }
  }

  async function handleReplace(files: FileList | null) {
    if (!files || files.length === 0 || replaceIndex === null) {
      return
    }

    const file = files[0]
    const targetIndex = replaceIndex
    const previousUrl = photos[targetIndex]
    const role = targetIndex === 0 ? 'thumbnail' : 'detail'

    await runUpload(file, role, async (publicUrl) => {
      const nextPhotos = [...photos]
      nextPhotos[targetIndex] = publicUrl
      applyGalleryPhotos(nextPhotos, form, onChange)

      if (previousUrl && previousUrl !== publicUrl) {
        await deleteProductImageByUrl(previousUrl)
      }
    })

    setReplaceIndex(null)
  }

  async function removePhoto(index: number) {
    const previousUrl = photos[index]
    const nextPhotos = photos.filter((_, photoIndex) => photoIndex !== index)
      applyGalleryPhotos(nextPhotos, form, onChange)
    setUploadSuccessMessage('사진이 삭제됐어요.')

    if (previousUrl && !isPlaceholderProductImage(previousUrl)) {
      await deleteProductImageByUrl(previousUrl)
    }
  }

  function reorderPhotos(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return
    }

    const nextPhotos = [...photos]
    const [moved] = nextPhotos.splice(fromIndex, 1)
    nextPhotos.splice(toIndex, 0, moved)
      applyGalleryPhotos(nextPhotos, form, onChange)
  }

  return (
    <div className="space-y-6">
      {uploadSuccessMessage && (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {uploadSuccessMessage}
        </p>
      )}

      {uploadError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {uploadError}
        </p>
      )}

      {uploadTasks.length > 0 && (
        <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm font-medium text-neutral-700">업로드 중...</p>
          {uploadTasks.map((task) => (
            <UploadProgressBar key={task.id} label={task.label} progress={task.progress} />
          ))}
        </div>
      )}

      <section className="space-y-6">
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

        <ProductImageUploadZone
          title="사진을 드래그하거나 클릭하세요"
          description="여러 장 한 번에 올릴 수 있어요"
          multiple
          compact={hasPhotos}
          disabled={isUploading}
          onPrepare={markUploadPreparing}
          onReject={markUploadRejected}
          onFilesSelected={(files) => void handleUpload(files)}
        />

        <p className="text-sm text-neutral-500">첫 번째 사진이 대표 사진이에요.</p>

        {hasPhotos && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {photos.map((image, index) => (
              <ProductImageGalleryItem
                key={`${image}-${index}`}
                imageUrl={image}
                index={index}
                isPrimary={index === 0}
                isDragging={dragIndex === index}
                isDropTarget={dropIndex === index && dragIndex !== index}
                disabled={isUploading}
                onDragStart={(itemIndex) => setDragIndex(itemIndex)}
                onDragOver={(itemIndex) => setDropIndex(itemIndex)}
                onDrop={(itemIndex) => {
                  if (dragIndex !== null) {
                    reorderPhotos(dragIndex, itemIndex)
                  }
                  setDragIndex(null)
                  setDropIndex(null)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDropIndex(null)
                }}
                onSetPrimary={(itemIndex) => {
                  if (itemIndex === 0) {
                    return
                  }
                  reorderPhotos(itemIndex, 0)
                  setUploadSuccessMessage('대표 사진으로 바꿨어요.')
                }}
                onReplace={(itemIndex) => {
                  setReplaceIndex(itemIndex)
                  replaceRef.current?.click()
                }}
                onDelete={(itemIndex) => void removePhoto(itemIndex)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
