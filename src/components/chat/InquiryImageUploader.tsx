import { useRef, useState } from 'react'
import {
  INQUIRY_IMAGE_LIMITS,
  validateInquiryImageFile,
} from '../../lib/inquiryImageUpload'

interface InquiryImageUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

export function InquiryImageUploader({ files, onChange, disabled = false }: InquiryImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (selected.length === 0) {
      return
    }

    const nextFiles = [...files, ...selected].slice(0, INQUIRY_IMAGE_LIMITS.maxFiles)

    for (const file of selected) {
      const validationError = validateInquiryImageFile(file)
      if (validationError) {
        setErrorMessage(validationError)
        return
      }
    }

    setErrorMessage(null)
    onChange(nextFiles)
  }

  function handleRemove(index: number) {
    onChange(files.filter((_, fileIndex) => fileIndex !== index))
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-neutral-700">
          사진 첨부 <span className="font-normal text-neutral-400">(선택, 최대 3장)</span>
        </label>
        <button
          type="button"
          disabled={disabled || files.length >= INQUIRY_IMAGE_LIMITS.maxFiles}
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
        >
          사진 추가
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleSelect}
      />

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-xl border border-neutral-200">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                aria-label="첨부 이미지 삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {errorMessage && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
