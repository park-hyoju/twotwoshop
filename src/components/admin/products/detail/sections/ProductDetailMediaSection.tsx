import { useEffect, useRef, useState } from 'react'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { DetailMediaItem } from '../../../../../types/detailMedia'
import { reindexDetailMediaByArrayOrder } from '../../../../../lib/detailMedia'
import { isPlaceholderProductImage } from '../../../../../lib/productImageStorage'
import { DETAIL_MEDIA_ACCEPT, isAcceptedVideoFile } from '../../../../../lib/productVideoStorage'
import { extractVideoMetadata } from '../../../../../lib/videoMetadata'
import {
  deleteProductImageByUrl,
  ProductImageUploadError,
  uploadProductImage,
} from '../../../../../services/adminProductImageUploadService'
import { uploadProductVideo } from '../../../../../services/adminProductVideoUploadService'
import {
  getDetailMediaFromForm,
  syncDetailMediaToForm,
} from '../detailContent/detailContent'
import { DetailMediaListItem } from './DetailMediaListItem'
import { DetailMediaUploadZone } from './DetailMediaUploadZone'
import { UploadProgressBar } from '../images/UploadProgressBar'

interface ProductDetailMediaSectionProps {
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
    if (error.message.trim()) {
      return error.message
    }

    if (typeof error.cause === 'string' && error.cause.trim()) {
      return error.cause
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return '업로드에 실패했어요.'
}

function createMediaId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function ProductDetailMediaSection({ form, onChange }: ProductDetailMediaSectionProps) {
  const replaceRef = useRef<HTMLInputElement>(null)
  const [detailMedia, setDetailMedia] = useState<DetailMediaItem[]>(() => getDetailMediaFromForm(form))
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const isUploading = uploadTasks.length > 0

  useEffect(() => {
    setDetailMedia(getDetailMediaFromForm(form))
  }, [form.id])

  function applyDetailMedia(nextMedia: DetailMediaItem[]) {
    setDetailMedia(nextMedia)
    syncDetailMediaToForm(nextMedia, form, onChange)
  }

  function removeTask(taskId: string) {
    setUploadTasks((current) => current.filter((task) => task.id !== taskId))
  }

  async function buildMediaItemFromFile(
    file: File,
    taskId: string,
  ): Promise<DetailMediaItem> {
    if (isAcceptedVideoFile(file)) {
      if (import.meta.env.DEV) {
        console.log('[detail-media] stage=video-selected', {
          name: file.name,
          mime: file.type || '(empty)',
          size: file.size,
        })
      }

      // 메타데이터 실패는 업로드를 막지 않음 (HEVC 등 미리보기 불가 코덱)
      const metadata = await extractVideoMetadata(file)

      const url = await uploadProductVideo(form.id, file, (progress) => {
        setUploadTasks((current) =>
          current.map((task) => (task.id === taskId ? { ...task, progress } : task)),
        )
      })

      if (import.meta.env.DEV) {
        console.log('[detail-media] stage=video-saved', { url, type: 'video' })
      }

      return {
        type: 'video',
        url,
        order: detailMedia.length,
        filename: file.name,
        thumbnail: metadata.thumbnail,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
      }
    }

    const url = await uploadProductImage(form.id, file, 'detail', (progress) => {
      setUploadTasks((current) =>
        current.map((task) => (task.id === taskId ? { ...task, progress } : task)),
      )
    })

    return {
      type: 'image',
      url,
      order: detailMedia.length,
      filename: file.name,
      thumbnail: url,
      duration: null,
      width: null,
      height: null,
    }
  }

  async function runUpload(file: File, onComplete: (item: DetailMediaItem) => void | Promise<void>) {
    const taskId = createMediaId()
    setUploadTasks((current) => [...current, { id: taskId, label: file.name, progress: 0 }])
    setUploadError(null)

    try {
      const item = await buildMediaItemFromFile(file, taskId)
      await onComplete(item)
    } catch (error) {
      setUploadError(getUploadErrorMessage(error))
    } finally {
      removeTask(taskId)
    }
  }

  async function handleUpload(files: File[]) {
    let next = [...detailMedia]
    for (const file of files) {
      await runUpload(file, (item) => {
        next = [...next, { ...item, order: next.length }]
        applyDetailMedia(next)
      })
    }
  }

  async function handleReplace(files: FileList | null) {
    if (!files?.length || replaceIndex === null) {
      return
    }

    const index = replaceIndex
    const previous = detailMedia[index]

    await runUpload(files[0], async (item) => {
      const next = [...detailMedia]
      next[index] = { ...item, order: index }
      applyDetailMedia(next)

      if (previous?.url && !isPlaceholderProductImage(previous.url)) {
        await deleteProductImageByUrl(previous.url)
      }
    })

    setReplaceIndex(null)
  }

  async function removeMedia(index: number) {
    const previous = detailMedia[index]
    applyDetailMedia(detailMedia.filter((_, i) => i !== index))

    if (previous?.url && !isPlaceholderProductImage(previous.url)) {
      await deleteProductImageByUrl(previous.url)
    }
  }

  function reorderMedia(from: number, to: number) {
    if (from === to) {
      return
    }

    const next = [...detailMedia]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    applyDetailMedia(reindexDetailMediaByArrayOrder(next))
  }

  const previewItem = previewIndex !== null ? detailMedia[previewIndex] : null

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-neutral-900">상세 미디어</h3>

      <input
        ref={replaceRef}
        type="file"
        accept={DETAIL_MEDIA_ACCEPT}
        className="absolute h-0 w-0 opacity-0"
        disabled={isUploading}
        onChange={(event) => {
          void handleReplace(event.target.files)
          event.target.value = ''
        }}
      />

      {uploadError && (
        <p role="alert" className="whitespace-pre-wrap rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
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

      <DetailMediaUploadZone
        compact={detailMedia.length > 0}
        disabled={isUploading}
        onReject={setUploadError}
        onFilesSelected={(files) => void handleUpload(files)}
      />

      {detailMedia.length > 0 && (
        <div className="space-y-2">
          {detailMedia.map((item, index) => (
            <DetailMediaListItem
              key={item.url}
              item={item}
              index={index}
              isDragging={dragIndex === index}
              isDropTarget={dropIndex === index && dragIndex !== index}
              disabled={isUploading}
              onDragStart={setDragIndex}
              onDragOver={setDropIndex}
              onDrop={(to) => {
                if (dragIndex !== null) {
                  reorderMedia(dragIndex, to)
                }
                setDragIndex(null)
                setDropIndex(null)
              }}
              onDragEnd={() => {
                setDragIndex(null)
                setDropIndex(null)
              }}
              onPreview={setPreviewIndex}
              onEdit={(i) => {
                setReplaceIndex(i)
                replaceRef.current?.click()
              }}
              onDelete={(i) => void removeMedia(i)}
            />
          ))}
        </div>
      )}

      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewIndex(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">{previewItem.filename}</p>
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                닫기
              </button>
            </div>

            {previewItem.type === 'video' ? (
              <video
                src={previewItem.url}
                controls
                playsInline
                preload="metadata"
                poster={previewItem.thumbnail ?? undefined}
                className="w-full bg-black"
              />
            ) : (
              <img src={previewItem.url} alt="" className="w-full object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
