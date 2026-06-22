interface ProductImageGalleryItemProps {
  imageUrl: string
  index: number
  isPrimary: boolean
  isDragging: boolean
  isDropTarget: boolean
  disabled?: boolean
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDrop: (index: number) => void
  onDragEnd: () => void
  onSetPrimary: (index: number) => void
  onReplace: (index: number) => void
  onDelete: (index: number) => void
}

export function ProductImageGalleryItem({
  imageUrl,
  index,
  isPrimary,
  isDragging,
  isDropTarget,
  disabled = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onSetPrimary,
  onReplace,
  onDelete,
}: ProductImageGalleryItemProps) {
  return (
    <div
      draggable={!disabled}
      onDragStart={() => onDragStart(index)}
      onDragOver={(event) => {
        event.preventDefault()
        onDragOver(index)
      }}
      onDrop={(event) => {
        event.preventDefault()
        onDrop(index)
      }}
      onDragEnd={onDragEnd}
      className={`group relative overflow-hidden rounded-xl border bg-white transition-all ${
        isDropTarget ? 'border-neutral-900 ring-2 ring-neutral-900/20' : 'border-neutral-200'
      } ${isDragging ? 'scale-[0.98] opacity-50' : ''}`}
    >
      <div className="aspect-square bg-neutral-100">
        <img
          src={imageUrl}
          alt={`상세 이미지 ${index + 1}`}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      <div className="absolute left-2 top-2 flex items-center gap-1">
        <span className="rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
          {index + 1}
        </span>
        {isPrimary && (
          <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
            대표
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1 bg-gradient-to-t from-black/75 via-black/45 to-transparent p-2 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          disabled={disabled || isPrimary}
          onClick={() => onSetPrimary(index)}
          className="rounded-md bg-white/95 px-2 py-1 text-xs font-medium text-neutral-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          대표 지정
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onReplace(index)}
          className="rounded-md bg-white/95 px-2 py-1 text-xs font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
        >
          교체
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDelete(index)}
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          삭제
        </button>
      </div>

      <div className="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
        ⋮⋮
      </div>
    </div>
  )
}
