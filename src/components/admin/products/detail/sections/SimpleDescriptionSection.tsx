import { useRef, useState } from 'react'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import {
  deleteProductImageByUrl,
  ProductImageUploadError,
  uploadProductImage,
} from '../../../../../services/adminProductImageUploadService'
import { PRODUCT_IMAGE_ACCEPT, isPlaceholderProductImage } from '../../../../../lib/productImageStorage'
import {
  adminCardClassName,
  adminInputClassName,
  adminLabelClassName,
  adminPageStackClassName,
  adminTextareaClassName,
} from '../adminFormStyles'
import { ProductImageUploadZone } from '../images/ProductImageUploadZone'
import { UploadProgressBar } from '../images/UploadProgressBar'

interface SimpleDescriptionSectionProps {
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

export function SimpleDescriptionSection({ form, onChange }: SimpleDescriptionSectionProps) {
  const replaceRef = useRef<HTMLInputElement>(null)
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null)

  const isUploading = uploadTasks.length > 0
  const detailImages = form.images.filter(
    (url) => url.trim() && !isPlaceholderProductImage(url),
  )

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
    onComplete: (publicUrl: string) => void | Promise<void>,
  ) {
    const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setUploadTasks((current) => [...current, { id: taskId, label: file.name, progress: 0 }])
    setUploadError(null)

    try {
      const publicUrl = await uploadProductImage(form.id, file, 'detail', (progress) => {
        updateTaskProgress(taskId, progress)
      })
      await onComplete(publicUrl)
    } catch (error) {
      setUploadError(getUploadErrorMessage(error))
    } finally {
      removeTask(taskId)
    }
  }

  async function handleAddImages(files: File[]) {
    let nextImages = [...form.images]

    for (const file of files) {
      await runUpload(file, (publicUrl) => {
        nextImages = [...nextImages, publicUrl]
        onChange('images', nextImages)
      })
    }
  }

  async function handleReplace(files: FileList | null) {
    if (!files || files.length === 0 || replaceIndex === null) {
      return
    }

    const file = files[0]
    const targetIndex = replaceIndex
    const previousUrl = form.images[targetIndex]

    await runUpload(file, async (publicUrl) => {
      const nextImages = [...form.images]
      nextImages[targetIndex] = publicUrl
      onChange('images', nextImages)

      if (previousUrl && previousUrl !== publicUrl) {
        await deleteProductImageByUrl(previousUrl)
      }
    })

    setReplaceIndex(null)
  }

  async function removeImage(index: number) {
    const previousUrl = form.images[index]
    onChange(
      'images',
      form.images.filter((_, imageIndex) => imageIndex !== index),
    )

    if (previousUrl && !isPlaceholderProductImage(previousUrl)) {
      await deleteProductImageByUrl(previousUrl)
    }
  }

  return (
    <div className={adminPageStackClassName}>
      <section className={adminCardClassName}>
        <label htmlFor="simple-short-description" className={adminLabelClassName}>
          짧은 설명
        </label>
        <p className="mb-3 text-sm text-neutral-500">목록과 상단에 보이는 한 줄 소개예요.</p>
        <input
          id="simple-short-description"
          value={form.short_description}
          onChange={(event) => onChange('short_description', event.target.value)}
          className={adminInputClassName}
          placeholder="예: 부드러운 면 소재의 데일리 티셔츠"
        />
      </section>

      <section className={adminCardClassName}>
        <label htmlFor="simple-description" className={adminLabelClassName}>
          상세 설명
        </label>
        <p className="mb-3 text-sm text-neutral-500">상품 페이지에 보이는 자세한 설명이에요.</p>
        <textarea
          id="simple-description"
          value={form.description}
          onChange={(event) => onChange('description', event.target.value)}
          rows={12}
          className={`${adminTextareaClassName} min-h-[16rem] resize-y`}
          placeholder="소재, 핏, 코디 팁 등을 자유롭게 적어 주세요."
        />
      </section>

      <section className={adminCardClassName}>
        <p className={adminLabelClassName}>상세 이미지</p>
        <p className="mb-4 text-sm text-neutral-500">
          설명 아래에 함께 보여질 사진을 추가할 수 있어요.
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
          <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError}
          </p>
        )}

        {uploadTasks.length > 0 && (
          <div className="mb-4 space-y-2">
            {uploadTasks.map((task) => (
              <UploadProgressBar key={task.id} label={task.label} progress={task.progress} />
            ))}
          </div>
        )}

        {detailImages.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {form.images.map((image, index) => {
              if (!image.trim() || isPlaceholderProductImage(image)) {
                return null
              }

              return (
                <div
                  key={`${image}-${index}`}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50"
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => {
                        setReplaceIndex(index)
                        replaceRef.current?.click()
                      }}
                      className="flex-1 rounded-lg bg-white/90 py-1 text-xs font-semibold text-neutral-800"
                    >
                      교체
                    </button>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => void removeImage(index)}
                      className="flex-1 rounded-lg bg-red-600 py-1 text-xs font-semibold text-white"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <ProductImageUploadZone
          title="사진 추가"
          description="클릭하거나 끌어다 놓으세요"
          multiple
          compact={detailImages.length > 0}
          disabled={isUploading}
          onFilesSelected={(files) => void handleAddImages(files)}
        />
      </section>
    </div>
  )
}
