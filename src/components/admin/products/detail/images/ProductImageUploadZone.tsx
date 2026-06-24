import { useId, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_HEIC_MESSAGE,
  PRODUCT_IMAGE_UPLOAD_HINT,
  filterAcceptedImageFiles,
  isHeicImageFile,
} from '../../../../../lib/productImageStorage'

interface ProductImageUploadZoneProps {
  title: string
  description: string
  multiple?: boolean
  disabled?: boolean
  compact?: boolean
  previewUrl?: string
  onPrepare?: (files: File[]) => void
  onReject?: (message: string) => void
  onFilesSelected: (files: File[]) => void
}

function logUploadEvent(event: string, detail?: unknown) {
  if (import.meta.env.DEV) {
    console.log(`[image-upload] ${event}`, detail)
  }
}

export function ProductImageUploadZone({
  title,
  description,
  multiple = false,
  disabled = false,
  compact = false,
  previewUrl,
  onPrepare,
  onReject,
  onFilesSelected,
}: ProductImageUploadZoneProps) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)
  const [localStatus, setLocalStatus] = useState<string | null>(null)

  function reject(message: string, source: 'input' | 'drop', detail?: unknown) {
    setLocalStatus(message)
    onReject?.(message)
    logUploadEvent(`${source}:rejected`, detail)
  }

  function processFileList(fileList: FileList | null, source: 'input' | 'drop') {
    logUploadEvent(`${source}:received`, {
      length: fileList?.length ?? 0,
      disabled,
    })

    if (disabled) {
      onReject?.('업로드가 진행 중입니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    if (!fileList || fileList.length === 0) {
      reject('선택된 파일이 없습니다. JPG, PNG, WEBP 이미지를 선택해 주세요.', source)
      return
    }

    const allFiles = Array.from(fileList)

    if (allFiles.some(isHeicImageFile)) {
      reject(PRODUCT_IMAGE_HEIC_MESSAGE, source, {
        names: allFiles.filter(isHeicImageFile).map((file) => file.name),
      })
      return
    }

    const acceptedFiles = filterAcceptedImageFiles(allFiles)

    if (acceptedFiles.length === 0) {
      reject('JPG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.', source, {
        names: allFiles.map((file) => file.name),
      })
      return
    }

    const selectedFiles = multiple ? acceptedFiles : acceptedFiles.slice(0, 1)
    const statusLabel = `업로드 준비 중... ${selectedFiles.map((file) => file.name).join(', ')}`

    setLocalStatus(statusLabel)
    logUploadEvent(`${source}:accepted`, {
      names: selectedFiles.map((file) => file.name),
    })

    onPrepare?.(selectedFiles)
    onFilesSelected(selectedFiles)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    logUploadEvent('input:onChange')
    processFileList(event.target.files, 'input')
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    logUploadEvent('drop:onDrop')
    processFileList(event.dataTransfer.files, 'drop')
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (!disabled) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return
    }

    setIsDragging(false)
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
        compact ? 'min-h-[7.5rem]' : previewUrl ? 'min-h-[12rem]' : 'min-h-[12rem]'
      } ${
        disabled
          ? 'cursor-not-allowed border-neutral-200 bg-neutral-50'
          : isDragging
            ? 'border-neutral-900 bg-neutral-100'
            : 'border-neutral-300 bg-white hover:border-neutral-500 hover:bg-neutral-50'
      }`}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        id={inputId}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        multiple={multiple}
        disabled={disabled}
        aria-label={title}
        onChange={handleInputChange}
        className={`absolute inset-0 z-20 h-full w-full opacity-0 disabled:cursor-not-allowed ${
          isDragging ? 'pointer-events-none' : 'cursor-pointer'
        }`}
      />

      {previewUrl && (
        <div className="pointer-events-none absolute inset-0 z-0 bg-neutral-50">
          <img
            src={previewUrl}
            alt="대표 이미지 미리보기"
            className="h-full w-full object-contain"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
        </div>
      )}

      <label
        htmlFor={inputId}
        className={`pointer-events-none relative z-10 flex flex-col items-center justify-center px-6 py-8 text-center ${
          compact ? 'px-4 py-5' : ''
        } ${previewUrl ? 'bg-black/35 text-white' : ''}`}
      >
        <div
          className={`mb-3 flex items-center justify-center rounded-full ${
            previewUrl ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
          } ${compact ? 'h-10 w-10 text-lg' : 'h-12 w-12 text-xl'}`}
        >
          ↑
        </div>
        <p className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
        <p className={`mt-1 ${compact ? 'text-xs' : 'text-sm'} ${previewUrl ? 'text-white/90' : 'text-neutral-500'}`}>
          {description}
        </p>
        <p className={`mt-2 text-xs ${previewUrl ? 'text-white/80' : 'text-neutral-400'}`}>
          {PRODUCT_IMAGE_UPLOAD_HINT}
        </p>
      </label>

      {localStatus && (
        <p
          role="status"
          className={`pointer-events-none relative z-10 border-t px-4 py-2 text-xs ${
            localStatus.startsWith('업로드 준비')
              ? 'border-neutral-200 bg-neutral-50 text-neutral-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {localStatus}
        </p>
      )}
    </div>
  )
}
