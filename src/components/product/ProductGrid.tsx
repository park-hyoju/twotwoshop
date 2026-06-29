import type { Product } from '../../types/product'
import { ProductCard } from './ProductCard'
import { cn } from '../../lib/cn'

interface ProductGridProps {
  products: Product[]
  centered?: boolean
}

export function ProductGrid({ products, centered = false }: ProductGridProps) {
  if (centered) {
    return (
      <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-4 md:gap-5 lg:gap-6">
        {products.map((product) => (
          <li
            key={product.id}
            className="w-[calc(50%-0.5rem)] max-w-[280px] md:w-[calc(33.333%-0.85rem)] lg:w-[calc(25%-1.125rem)]"
          >
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6',
      )}
    >
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
