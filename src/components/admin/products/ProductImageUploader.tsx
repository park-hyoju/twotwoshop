import { useEffect, useRef, useState } from 'react'
import { ProductImageCropModal, type ProductCropAspect } from './ProductImageCropModal'

export interface ProductImageValue {
  previewUrl: string
  /** 새로 업로드·자른 이미지. null이면 서버에 저장된 기존 URL. */
  file: File | null
}

interface ProductImageUploaderProps {
  label: string
  required?: boolean
  value: ProductImageValue | null
  defaultAspect?: ProductCropAspect
  onChange: (value: ProductImageValue | null) => void
  disabled?: boolean
}

export function ProductImageUploader({
  label,
  required = false,
  value,
  defaultAspect = '1:1',
  onChange,
  disabled = false,
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cropSource, setCropSource] = useState<{ src: string; name: string } | null>(null)

  useEffect(() => {
    return () => {
      if (value?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(value.previewUrl)
      }
    }
  }, [value?.previewUrl])

  function openFilePicker() {
    inputRef.current?.click()
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const src = URL.createObjectURL(file)
    setCropSource({ src, name: file.name })
  }

  function applyFile(file: File) {
    if (value?.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(value.previewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    onChange({ previewUrl, file: file })
    if (cropSource?.src.startsWith('blob:')) {
      URL.revokeObjectURL(cropSource.src)
    }
    setCropSource(null)
  }

  function handleDelete() {
    if (value?.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(value.previewUrl)
    }
    onChange(null)
  }

  function handleRecrop() {
    if (!value) {
      return
    }

    setCropSource({ src: value.previewUrl, name: value.file?.name ?? 'product-image.jpg' })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-800">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </p>
        {!value && (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-700"
          >
            이미지 선택
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelected}
      />

      {value && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <img
            src={value.previewUrl}
            alt=""
            className="mx-auto max-h-48 w-full max-w-xs rounded-lg object-contain"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRecrop}
              disabled={disabled}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700"
            >
              다시 자르기
            </button>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={disabled}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700"
            >
              이미지 교체
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={disabled}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
            >
              삭제
            </button>
          </div>
        </div>
      )}

      {cropSource && (
        <ProductImageCropModal
          isOpen
          imageSrc={cropSource.src}
          fileName={cropSource.name}
          initialAspect={defaultAspect}
          onClose={() => {
            if (cropSource.src.startsWith('blob:')) {
              URL.revokeObjectURL(cropSource.src)
            }
            setCropSource(null)
          }}
          onComplete={applyFile}
          onUseOriginal={applyFile}
        />
      )}
    </div>
  )
}

interface ProductAdditionalImagesProps {
  images: ProductImageValue[]
  onChange: (images: ProductImageValue[]) => void
  disabled?: boolean
}

export function ProductAdditionalImagesUploader({
  images,
  onChange,
  disabled = false,
}: ProductAdditionalImagesProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cropSource, setCropSource] = useState<{ src: string; name: string; index: number | null } | null>(
    null,
  )

  function openFilePicker() {
    inputRef.current?.click()
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setCropSource({ src: URL.createObjectURL(file), name: file.name, index: null })
  }

  function applyCropped(file: File, index: number | null) {
    const previewUrl = URL.createObjectURL(file)
    const next: ProductImageValue = { previewUrl, file }

    if (index === null) {
      onChange([...images, next])
    } else {
      const copy = [...images]
      if (copy[index]?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(copy[index].previewUrl)
      }
      copy[index] = next
      onChange(copy)
    }

    if (cropSource?.src.startsWith('blob:')) {
      URL.revokeObjectURL(cropSource.src)
    }
    setCropSource(null)
  }

  function removeAt(index: number) {
    const copy = [...images]
    if (copy[index]?.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(copy[index].previewUrl)
    }
    copy.splice(index, 1)
    onChange(copy)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-800">추가 이미지</p>
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-700"
        >
          이미지 추가
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelected}
      />

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={`${image.previewUrl}-${index}`} className="rounded-xl border border-neutral-200 p-2">
              <img src={image.previewUrl} alt="" className="h-28 w-full rounded-lg object-cover" />
              <div className="mt-2 flex flex-wrap gap-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    setCropSource({
                      src: image.previewUrl,
                      name: image.file?.name ?? 'product-image.jpg',
                      index,
                    })
                  }
                  className="rounded border border-neutral-300 px-2 py-1 text-[11px] font-semibold"
                >
                  다시 자르기
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeAt(index)}
                  className="rounded border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-700"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cropSource && (
        <ProductImageCropModal
          isOpen
          imageSrc={cropSource.src}
          fileName={cropSource.name}
          initialAspect="4:5"
          onClose={() => {
            if (cropSource.src.startsWith('blob:')) {
              URL.revokeObjectURL(cropSource.src)
            }
            setCropSource(null)
          }}
          onComplete={(file) => applyCropped(file, cropSource.index)}
          onUseOriginal={(file) => applyCropped(file, cropSource.index)}
        />
      )}
    </div>
  )
}
