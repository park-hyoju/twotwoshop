import { useState } from 'react'
import { BANNER_ASPECT_CLASS } from '../../../lib/bannerConstants'
import type { BannerRow } from '../../../types/banner'
import { BannerStorefrontPreview } from './BannerStorefrontPreview'

interface AdminBannersListProps {
  banners: BannerRow[]
  actionId: string | null
  onEdit: (banner: BannerRow) => void
  onDelete: (bannerId: string) => void
  onToggleActive: (bannerId: string, isActive: boolean) => void
  onReorder: (orderedIds: string[]) => void
}

export function AdminBannersList({
  banners,
  actionId,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
}: AdminBannersListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [previewBanner, setPreviewBanner] = useState<BannerRow | null>(null)

  function reorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return
    }

    const next = [...banners]
    const [moved] = next.splice(fromIndex, 1)
    if (!moved) {
      return
    }

    next.splice(toIndex, 0, moved)
    onReorder(next.map((banner) => banner.id))
  }

  return (
    <>
      <p className="mb-3 text-sm text-neutral-500">
        카드를 드래그해 노출 순서를 변경할 수 있습니다.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {banners.map((banner, index) => {
          const isBusy = actionId === banner.id
          const desktopThumbnail = banner.desktop_image
          const mobileThumbnail = banner.mobile_image
          const fallbackThumbnail = mobileThumbnail ?? desktopThumbnail

          return (
            <article
              key={banner.id}
              draggable={!isBusy}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => {
                event.preventDefault()
                setDropIndex(index)
              }}
              onDrop={() => {
                if (dragIndex !== null) {
                  reorder(dragIndex, index)
                }
                setDragIndex(null)
                setDropIndex(null)
              }}
              onDragEnd={() => {
                setDragIndex(null)
                setDropIndex(null)
              }}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                dragIndex === index ? 'scale-[0.99] opacity-60' : ''
              } ${
                dropIndex === index && dragIndex !== index
                  ? 'border-neutral-900 ring-2 ring-neutral-900/10'
                  : 'border-neutral-200'
              }`}
            >
              <div className={`relative bg-neutral-100 ${BANNER_ASPECT_CLASS}`}>
                {fallbackThumbnail ? (
                  <picture className="absolute inset-0">
                    {mobileThumbnail && (
                      <source media="(max-width: 1023px)" srcSet={mobileThumbnail} />
                    )}
                    <img
                      src={desktopThumbnail ?? mobileThumbnail ?? ''}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </picture>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                    이미지 없음
                  </div>
                )}

                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    순서 {banner.sort_order}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${
                      banner.is_active
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-neutral-500/80 text-white'
                    }`}
                  >
                    {banner.is_active ? '활성' : '비활성'}
                  </span>
                </div>

                <button
                  type="button"
                  className="absolute right-3 top-3 cursor-grab rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm active:cursor-grabbing"
                  aria-label="순서 변경"
                  disabled={isBusy}
                >
                  ☰ 드래그
                </button>
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    {banner.eyebrow ?? 'TWOTWOSHOP'}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                    {banner.headline ?? banner.title}
                  </h3>
                  {banner.description.trim().length > 0 ? (
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{banner.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-neutral-500">
                    {banner.button_text || '버튼 없음'}
                    {banner.button_link ? ` → ${banner.button_link}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewBanner(banner)}
                    disabled={isBusy}
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    미리보기
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleActive(banner.id, !banner.is_active)}
                    disabled={isBusy}
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    {banner.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(banner)}
                    disabled={isBusy}
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(banner.id)}
                    disabled={isBusy}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {previewBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">배너 미리보기</h3>
              <button
                type="button"
                onClick={() => setPreviewBanner(null)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                닫기
              </button>
            </div>
            <BannerStorefrontPreview
              form={{
                eyebrow: previewBanner.eyebrow ?? '',
                headline: previewBanner.headline ?? previewBanner.title,
                description: previewBanner.description,
                button_text: previewBanner.button_text,
                button_link: previewBanner.button_link,
                desktop_image: previewBanner.desktop_image ?? '',
                mobile_image: previewBanner.mobile_image ?? '',
                is_active: previewBanner.is_active,
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
