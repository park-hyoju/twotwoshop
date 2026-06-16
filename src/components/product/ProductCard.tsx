import { Link } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'
import type { Product } from '../../types/product'
import { formatPrice } from '../../lib/formatPrice'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div
        className="flex aspect-square items-center justify-center bg-neutral-200 text-base text-neutral-500"
        aria-label={product.imageAlt}
      >
        상품 이미지
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-neutral-900 sm:text-lg">
          {product.name}
        </h3>

        <p className="text-xl font-bold text-neutral-900 sm:text-2xl">
          {formatPrice(product.price)}
        </p>

        <Link
          to={ROUTES.products}
          className="mt-auto flex min-h-14 w-full items-center justify-center rounded-xl bg-neutral-900 py-4 text-base font-semibold text-white transition-colors hover:bg-neutral-700 sm:text-lg"
        >
          상품보기
        </Link>
      </div>
    </article>
  )
}
