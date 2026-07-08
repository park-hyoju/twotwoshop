import { calculateDiscountRate } from '../../../lib/calculateDiscountRate'
import { formatPrice } from '../../../lib/formatPrice'
import type { AdminProductRow } from '../../../types/adminProduct'
import { ProductStatusBadge } from './ProductStatusBadge'

interface AdminProductsListProps {
  products: AdminProductRow[]
  actionProductId: string | null
  onDetailEdit: (product: AdminProductRow) => void
  onCopy: (product: AdminProductRow) => void
  onDelete: (product: AdminProductRow) => void
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = 'default',
}: {
  children: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger' | 'primary'
}) {
  const variantClassName =
    variant === 'danger'
      ? 'border-red-200 text-red-700 hover:bg-red-50'
      : variant === 'primary'
        ? 'border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700'
        : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${variantClassName}`}
    >
      {children}
    </button>
  )
}

function ProductThumbnail({ url, name }: { url: string | null; name: string }) {
  if (!url) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-neutral-100 text-[10px] text-neutral-400">
        없음
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={name}
      className="h-14 w-14 rounded-lg border border-neutral-200 object-cover"
    />
  )
}

function DiscountCell({ product }: { product: AdminProductRow }) {
  const rate =
    product.discount_rate > 0
      ? product.discount_rate
      : calculateDiscountRate(product.original_price, product.price)

  if (rate === null || rate <= 0) {
    return <span className="text-neutral-400">-</span>
  }

  return <span className="font-semibold text-rose-600">{rate}%</span>
}

function StockCell({ totalStock }: { totalStock: number }) {
  const status =
    totalStock <= 0 ? 'soldout' : totalStock <= 5 ? 'low' : 'normal'

  return (
    <div className="flex items-center gap-2">
      <span>{totalStock.toLocaleString('ko-KR')}</span>
      {status === 'soldout' && (
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-700">
          품절
        </span>
      )}
      {status === 'low' && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
          재고 부족
        </span>
      )}
    </div>
  )
}

function MobileProductCard({
  product,
  actionProductId,
  onDetailEdit,
  onCopy,
  onDelete,
}: {
  product: AdminProductRow
  actionProductId: string | null
  onDetailEdit: (product: AdminProductRow) => void
  onCopy: (product: AdminProductRow) => void
  onDelete: (product: AdminProductRow) => void
}) {
  const isBusy = actionProductId === product.id

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <ProductThumbnail url={product.thumbnail} name={product.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">{product.name}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">{formatPrice(product.price)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DiscountCell product={product} />
            <ProductStatusBadge status={product.status} />
          </div>
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-sm text-neutral-700">
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">총 재고</dt>
          <dd>
            <StockCell totalStock={product.total_stock} />
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton onClick={() => onDetailEdit(product)} disabled={isBusy} variant="primary">
          상세 수정
        </ActionButton>
        <ActionButton onClick={() => onCopy(product)} disabled={isBusy}>
          복사
        </ActionButton>
        <ActionButton onClick={() => onDelete(product)} disabled={isBusy} variant="danger">
          삭제
        </ActionButton>
      </div>
    </article>
  )
}

export function AdminProductsList({
  products,
  actionProductId,
  onDetailEdit,
  onCopy,
  onDelete,
}: AdminProductsListProps) {
  return (
    <>
      <div className="space-y-4 lg:hidden">
        {products.map((product) => (
          <MobileProductCard
            key={product.id}
            product={product}
            actionProductId={actionProductId}
            onDetailEdit={onDetailEdit}
            onCopy={onCopy}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-neutral-200 bg-white lg:block">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">대표 이미지</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">상품명</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">판매가</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">할인율</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">총 재고</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">상태</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {products.map((product) => {
              const isBusy = actionProductId === product.id

              return (
                <tr key={product.id} className="text-sm text-neutral-800">
                  <td className="px-4 py-3">
                    <ProductThumbnail url={product.thumbnail} name={product.name} />
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{product.name}</td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3">
                    <DiscountCell product={product} />
                  </td>
                  <td className="px-4 py-3">
                    <StockCell totalStock={product.total_stock} />
                  </td>
                  <td className="px-4 py-3">
                    <ProductStatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        onClick={() => onDetailEdit(product)}
                        disabled={isBusy}
                        variant="primary"
                      >
                        상세 수정
                      </ActionButton>
                      <ActionButton onClick={() => onCopy(product)} disabled={isBusy}>
                        복사
                      </ActionButton>
                      <ActionButton onClick={() => onDelete(product)} disabled={isBusy} variant="danger">
                        삭제
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
