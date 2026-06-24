import { getRenderableIntroBlocks } from '../../../lib/productIntroContent'
import { ProductImage } from '../ProductImage'

interface ProductDetailIntroBlocksProps {
  shortDescription: string
  productSlug: string
  productName: string
}

export function ProductDetailIntroBlocks({
  shortDescription,
  productSlug,
  productName,
}: ProductDetailIntroBlocksProps) {
  const blocks = getRenderableIntroBlocks(shortDescription)

  if (blocks.length === 0) {
    return null
  }

  return (
    <div className="space-y-8">
      {blocks.map((block, index) => (
        <article key={block.id} className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-neutral-100">
            <ProductImage
              src={block.imageUrl}
              alt={`${productName} 상세 이미지 ${index + 1}`}
              slug={productSlug}
              className="w-full object-cover"
            />
          </div>
          {block.text.trim() && (
            <p className="whitespace-pre-wrap text-base leading-7 text-neutral-700 sm:text-lg sm:leading-8">
              {block.text}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}
