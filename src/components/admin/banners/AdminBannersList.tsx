import { useState } from 'react'
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
      <div className="space-y-3">
        {banners.map((banner, index) => {
          const isBusy = actionId === banner.id
          const thumbnail = banner.mobile_image ?? banner.desktop_image

          return (
            <div
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
              className={`rounded-xl border bg-white p-4 transition ${
                dragIndex === index ? 'scale-[0.99] opacity-60' : ''
              } ${
                dropIndex === index && dragIndex !== index
                  ? 'border-neutral-900'
                  : 'border-neutral-200'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3 sm:flex-1">
                  <button
                    type="button"
                    className="mt-1 cursor-grab text-neutral-400 active:cursor-grabbing"
                    aria-label="순서 변경"
                    disabled={isBusy}
                  >
                    ☰
                  </button>

                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                    {thumbnail ? (
                      <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">
                        NO IMAGE
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-neutral-900">{banner.title}</p>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                        순서 {banner.sort_order}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          banner.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {banner.is_active ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{banner.description}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {banner.button_text} → {banner.button_link}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
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
            </div>
          )
        })}
      </div>

      {previewBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6">
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
                title: previewBanner.title,
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
