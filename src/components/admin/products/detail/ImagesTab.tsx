import { useState } from 'react'
import type { AdminProductDetailForm } from '../../../../types/adminProductDetail'
import { adminInputClassName, adminLabelClassName, adminSectionClassName } from './adminFormStyles'

interface ImagesTabProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-500">
        미리보기 없음
      </div>
    )
  }

  return (
    <img src={src} alt={alt} className="h-32 w-full rounded-lg object-cover" />
  )
}

export function ImagesTab({ form, onChange }: ImagesTabProps) {
  const [newImageUrl, setNewImageUrl] = useState('')

  function applyPlaceholderThumbnail() {
    if (!form.slug.trim()) {
      return
    }

    onChange('thumbnail', `/images/placeholder/${form.slug.trim()}.jpg`)
  }

  function addDetailImage() {
    const url = newImageUrl.trim()
    if (!url) {
      return
    }

    onChange('images', [...form.images, url])
    setNewImageUrl('')
  }

  function removeDetailImage(index: number) {
    onChange(
      'images',
      form.images.filter((_, imageIndex) => imageIndex !== index),
    )
  }

  function moveDetailImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= form.images.length) {
      return
    }

    const nextImages = [...form.images]
    const [moved] = nextImages.splice(index, 1)
    nextImages.splice(nextIndex, 0, moved)
    onChange('images', nextImages)
  }

  return (
    <div className="space-y-6">
      <section className={adminSectionClassName}>
        <h3 className="text-lg font-semibold text-neutral-900">대표 이미지</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Storage 연동 전까지 URL 또는 placeholder 경로를 입력하세요.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-[12rem_1fr]">
          <ImagePreview src={form.thumbnail} alt="대표 이미지" />
          <div className="space-y-3">
            <div>
              <label htmlFor="detail-thumbnail" className={adminLabelClassName}>
                이미지 URL
              </label>
              <input
                id="detail-thumbnail"
                value={form.thumbnail}
                onChange={(event) => onChange('thumbnail', event.target.value)}
                placeholder="/images/placeholder/product-slug.jpg"
                className={adminInputClassName}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyPlaceholderThumbnail}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                placeholder 적용
              </button>
              <button
                type="button"
                onClick={() => onChange('thumbnail', '')}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={adminSectionClassName}>
        <h3 className="text-lg font-semibold text-neutral-900">상세 이미지</h3>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={newImageUrl}
            onChange={(event) => setNewImageUrl(event.target.value)}
            placeholder="상세 이미지 URL"
            className={adminInputClassName}
          />
          <button
            type="button"
            onClick={addDetailImage}
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            추가
          </button>
        </div>

        {form.images.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">등록된 상세 이미지가 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {form.images.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="grid gap-4 rounded-lg border border-neutral-200 p-4 md:grid-cols-[10rem_1fr_auto]"
              >
                <ImagePreview src={image} alt={`상세 이미지 ${index + 1}`} />
                <p className="break-all text-sm text-neutral-700">{image}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveDetailImage(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDetailImage(index, 1)}
                    disabled={index === form.images.length - 1}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDetailImage(index)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
