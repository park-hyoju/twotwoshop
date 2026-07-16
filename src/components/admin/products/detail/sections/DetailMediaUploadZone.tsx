import { useId, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  DETAIL_MEDIA_ACCEPT,
  filterAcceptedDetailMediaFiles,
  getDetailMediaRejectMessage,
} from '../../../../../lib/productVideoStorage'

interface DetailMediaUploadZoneProps {
  disabled?: boolean
  compact?: boolean
  onFilesSelected: (files: File[]) => void
  onReject?: (message: string) => void
}

export function DetailMediaUploadZone({
  disabled = false,
  compact = false,
  onFilesSelected,
  onReject,
}: DetailMediaUploadZoneProps) {
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)

  function processFileList(fileList: FileList | null) {
    if (disabled) {
      onReject?.('업로드가 진행 중입니다.')
      return
    }

    if (!fileList || fileList.length === 0) {
      return
    }

    const files = Array.from(fileList)
    const accepted = filterAcceptedDetailMediaFiles(files)
    if (accepted.length === 0) {
      onReject?.(getDetailMediaRejectMessage(files))
      return
    }

    onFilesSelected(accepted)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    processFileList(event.target.files)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    processFileList(event.dataTransfer.files)
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
        compact ? 'min-h-[7rem]' : 'min-h-[9rem]'
      } ${
        disabled
          ? 'cursor-not-allowed border-neutral-200 bg-neutral-50'
          : isDragging
            ? 'border-neutral-900 bg-neutral-100'
            : 'border-neutral-300 bg-white hover:border-neutral-500 hover:bg-neutral-50'
      }`}
      onDragEnter={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setIsDragging(false)
        }
      }}
      onDrop={handleDrop}
    >
      <input
        id={inputId}
        type="file"
        accept={DETAIL_MEDIA_ACCEPT}
        multiple
        disabled={disabled}
        aria-label="상세 미디어 업로드"
        onChange={handleInputChange}
        className={`absolute inset-0 z-20 h-full w-full opacity-0 disabled:cursor-not-allowed ${
          isDragging ? 'pointer-events-none' : 'cursor-pointer'
        }`}
      />

      <label
        htmlFor={inputId}
        className={`pointer-events-none relative z-10 flex flex-col items-center justify-center px-6 py-8 text-center ${
          compact ? 'px-4 py-5' : ''
        }`}
      >
        <div
          className={`mb-3 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 ${
            compact ? 'h-10 w-10 text-lg' : 'h-12 w-12 text-xl'
          }`}
        >
          ↑
        </div>
        <p className={`font-semibold text-neutral-900 ${compact ? 'text-sm' : 'text-base'}`}>
          이미지 / 영상 업로드
        </p>
        <p className={`mt-1 text-neutral-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          또는 드래그해서 추가
        </p>
      </label>
    </div>
  )
}
