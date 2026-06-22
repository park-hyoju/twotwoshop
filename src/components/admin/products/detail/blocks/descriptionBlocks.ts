export type DescriptionBlockType = 'text' | 'image'

export interface DescriptionBlock {
  id: string
  type: DescriptionBlockType
  content: string
}

export function createBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function createEmptyTextBlock(): DescriptionBlock {
  return { id: createBlockId(), type: 'text', content: '' }
}

export function createEmptyImageBlock(): DescriptionBlock {
  return { id: createBlockId(), type: 'image', content: '' }
}

export function blocksFromDescription(description: string): DescriptionBlock[] {
  const trimmed = description.trim()
  if (!trimmed) {
    return [createEmptyTextBlock()]
  }

  return [{ id: createBlockId(), type: 'text', content: description }]
}

export function serializeBlocksToDescription(blocks: DescriptionBlock[]): string {
  return blocks
    .filter((block) => block.type === 'text')
    .map((block) => block.content.trim())
    .filter(Boolean)
    .join('\n\n')
}

export function mergeImageBlocksIntoImages(
  blocks: DescriptionBlock[],
  currentImages: string[],
): string[] {
  const imageUrls = blocks
    .filter((block) => block.type === 'image' && block.content.trim())
    .map((block) => block.content.trim())

  const merged = [...currentImages]
  for (const url of imageUrls) {
    if (!merged.includes(url)) {
      merged.push(url)
    }
  }

  return merged
}
