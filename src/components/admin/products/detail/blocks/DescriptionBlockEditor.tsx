import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import { adminCardClassName, adminInputClassName, adminLabelClassName, adminTextareaClassName } from '../adminFormStyles'
import {
  createEmptyImageBlock,
  createEmptyTextBlock,
  type DescriptionBlock,
  mergeImageBlocksIntoImages,
  serializeBlocksToDescription,
} from './descriptionBlocks'

interface DescriptionBlockEditorProps {
  blocks: DescriptionBlock[]
  form: AdminProductDetailForm
  onBlocksChange: (blocks: DescriptionBlock[]) => void
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

function syncBlocksToForm(
  blocks: DescriptionBlock[],
  form: AdminProductDetailForm,
  onChange: DescriptionBlockEditorProps['onChange'],
) {
  onChange('description', serializeBlocksToDescription(blocks))
  onChange('images', mergeImageBlocksIntoImages(blocks, form.images))
}

export function DescriptionBlockEditor({
  blocks,
  form,
  onBlocksChange,
  onChange,
}: DescriptionBlockEditorProps) {
  function updateBlocks(nextBlocks: DescriptionBlock[]) {
    onBlocksChange(nextBlocks)
    syncBlocksToForm(nextBlocks, form, onChange)
  }

  function updateBlock(index: number, content: string) {
    const nextBlocks = blocks.map((block, blockIndex) =>
      blockIndex === index ? { ...block, content } : block,
    )
    updateBlocks(nextBlocks)
  }

  function addBlock(type: DescriptionBlock['type']) {
    const nextBlock = type === 'text' ? createEmptyTextBlock() : createEmptyImageBlock()
    updateBlocks([...blocks, nextBlock])
  }

  function removeBlock(index: number) {
    if (blocks.length <= 1) {
      updateBlocks([createEmptyTextBlock()])
      return
    }

    updateBlocks(blocks.filter((_, blockIndex) => blockIndex !== index))
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= blocks.length) {
      return
    }

    const nextBlocks = [...blocks]
    const [moved] = nextBlocks.splice(index, 1)
    nextBlocks.splice(targetIndex, 0, moved)
    updateBlocks(nextBlocks)
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div key={block.id} className={`${adminCardClassName} space-y-3 border-dashed`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-neutral-700">
              {block.type === 'text' ? '텍스트 블록' : '이미지 블록'}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveBlock(index, -1)}
                disabled={index === 0}
                className="rounded-lg px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveBlock(index, 1)}
                disabled={index === blocks.length - 1}
                className="rounded-lg px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeBlock(index)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </div>

          {block.type === 'text' ? (
            <textarea
              value={block.content}
              onChange={(event) => updateBlock(index, event.target.value)}
              rows={6}
              className={`${adminTextareaClassName} min-h-[8rem] resize-y`}
              placeholder="상세 설명 텍스트를 입력하세요"
            />
          ) : (
            <div className="space-y-3">
              <label className={adminLabelClassName}>이미지 URL</label>
              <input
                value={block.content}
                onChange={(event) => updateBlock(index, event.target.value)}
                className={adminInputClassName}
                placeholder="업로드한 상품사진 URL을 붙여넣으세요"
              />
              {block.content.trim() && (
                <img
                  src={block.content}
                  alt={`블록 이미지 ${index + 1}`}
                  className="max-h-64 w-full rounded-xl object-contain bg-neutral-50"
                />
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addBlock('text')}
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          + 텍스트
        </button>
        <button
          type="button"
          onClick={() => addBlock('image')}
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          + 사진
        </button>
      </div>
    </div>
  )
}
