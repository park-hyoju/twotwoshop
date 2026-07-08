import type { DetailMediaItem } from '../../../../../types/detailMedia'

interface DetailMediaListItemProps {
  item: DetailMediaItem
  index: number
  isDragging: boolean
  isDropTarget: boolean
  disabled?: boolean
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDrop: (index: number) => void
  onDragEnd: () => void
  onPreview: (index: number) => void
  onEdit: (index: number) => void
  onDelete: (index: number) => void
}

export function DetailMediaListItem({
  item,
  index,
  isDragging,
  isDropTarget,
  disabled = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onPreview,
  onEdit,
  onDelete,
}: DetailMediaListItemProps) {
  const thumbnail = item.thumbnail || (item.type === 'image' ? item.url : null)

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
      className={`flex items-center gap-3 rounded-xl border bg-white p-3 transition-all ${
        isDropTarget ? 'border-neutral-900 ring-2 ring-neutral-900/20' : 'border-neutral-200'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <span className="text-xs font-medium text-neutral-500">영상</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-neutral-900 px-2 text-xs font-semibold text-white">
            {index + 1}
          </span>
          <span className="truncate text-sm text-neutral-700">{item.filename}</span>
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
            {item.type === 'video' ? '영상' : '이미지'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          aria-label="드래그"
          className="cursor-grab rounded-lg px-2 py-2 text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
        >
          ☰
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPreview(index)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          미리보기
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onEdit(index)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          편집
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDelete(index)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          삭제
        </button>
      </div>
    </div>
  )
}
