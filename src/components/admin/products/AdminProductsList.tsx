import { formatDateTime } from '../../../lib/formatDateTime'
import { formatPrice } from '../../../lib/formatPrice'
import { getDisplayCategoryLabel } from '../../../lib/adminProductStatus'
import type { AdminProductRow } from '../../../types/adminProduct'
import { ProductStatusBadge } from './ProductStatusBadge'

interface AdminProductsListProps {
  products: AdminProductRow[]
  actionProductId: string | null
  onEdit: (product: AdminProductRow) => void
  onDetailEdit: (product: AdminProductRow) => void
  onDelete: (product: AdminProductRow) => void
  onSoldOut: (productId: string) => void
  onToggleVisibility: (productId: string, visible: boolean) => void
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

function ProductActions({
  product,
  actionProductId,
  onEdit,
  onDetailEdit,
  onDelete,
  onSoldOut,
  onToggleVisibility,
}: {
  product: AdminProductRow
  actionProductId: string | null
  onEdit: (product: AdminProductRow) => void
  onDetailEdit: (product: AdminProductRow) => void
  onDelete: (product: AdminProductRow) => void
  onSoldOut: (productId: string) => void
  onToggleVisibility: (productId: string, visible: boolean) => void
}) {
  const isBusy = actionProductId === product.id

  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton onClick={() => onDetailEdit(product)} disabled={isBusy} variant="primary">
        상세 수정
      </ActionButton>
      <ActionButton onClick={() => onEdit(product)} disabled={isBusy}>
        수정
      </ActionButton>
      <ActionButton onClick={() => onSoldOut(product.id)} disabled={isBusy}>
        품절
      </ActionButton>
      {product.status === 'hidden' ? (
        <ActionButton
          onClick={() => onToggleVisibility(product.id, true)}
          disabled={isBusy}
          variant="primary"
        >
          노출 ON
        </ActionButton>
      ) : (
        <ActionButton onClick={() => onToggleVisibility(product.id, false)} disabled={isBusy}>
          노출 OFF
        </ActionButton>
      )}
      <ActionButton onClick={() => onDelete(product)} disabled={isBusy} variant="danger">
        삭제
      </ActionButton>
    </div>
  )
}

function MobileProductCard({
  product,
  actionProductId,
  onEdit,
  onDetailEdit,
  onDelete,
  onSoldOut,
  onToggleVisibility,
}: {
  product: AdminProductRow
  actionProductId: string | null
  onEdit: (product: AdminProductRow) => void
  onDetailEdit: (product: AdminProductRow) => void
  onDelete: (product: AdminProductRow) => void
  onSoldOut: (productId: string) => void
  onToggleVisibility: (productId: string, visible: boolean) => void
}) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => onDetailEdit(product)}
            className="text-left text-sm font-semibold text-neutral-900 underline-offset-2 hover:underline"
          >
            {product.name}
          </button>
          <p className="mt-1 text-xs text-neutral-500">{product.slug}</p>
        </div>
        <ProductStatusBadge status={product.status} />
      </div>

      <dl className="mt-4 space-y-2 text-sm text-neutral-700">
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">가격</dt>
          <dd className="font-semibold text-neutral-900">{formatPrice(product.price)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">재고</dt>
          <dd>{product.stock.toLocaleString('ko-KR')}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">카테고리</dt>
          <dd>{getDisplayCategoryLabel(product.display_category)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-neutral-500">생성일</dt>
          <dd>{formatDateTime(product.created_at)}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <ProductActions
          product={product}
          actionProductId={actionProductId}
          onEdit={onEdit}
          onDetailEdit={onDetailEdit}
          onDelete={onDelete}
          onSoldOut={onSoldOut}
          onToggleVisibility={onToggleVisibility}
        />
      </div>
    </article>
  )
}

export function AdminProductsList({
  products,
  actionProductId,
  onEdit,
  onDetailEdit,
  onDelete,
  onSoldOut,
  onToggleVisibility,
}: AdminProductsListProps) {
  return (
    <>
      <div className="space-y-4 lg:hidden">
        {products.map((product) => (
          <MobileProductCard
            key={product.id}
            product={product}
            actionProductId={actionProductId}
            onEdit={onEdit}
            onDetailEdit={onDetailEdit}
            onDelete={onDelete}
            onSoldOut={onSoldOut}
            onToggleVisibility={onToggleVisibility}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-neutral-200 bg-white lg:block">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">상품명</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">가격</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">재고</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">상태</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">카테고리</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">생성일</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {products.map((product) => (
              <tr key={product.id} className="text-sm text-neutral-800">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onDetailEdit(product)}
                    className="text-left font-medium text-neutral-900 underline-offset-2 hover:underline"
                  >
                    {product.name}
                  </button>
                  <p className="mt-1 text-xs text-neutral-500">{product.slug}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-neutral-900">
                  {formatPrice(product.price)}
                </td>
                <td className="px-4 py-3">{product.stock.toLocaleString('ko-KR')}</td>
                <td className="px-4 py-3">
                  <ProductStatusBadge status={product.status} />
                </td>
                <td className="px-4 py-3">{getDisplayCategoryLabel(product.display_category)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(product.created_at)}</td>
                <td className="px-4 py-3">
                  <ProductActions
                    product={product}
                    actionProductId={actionProductId}
                    onEdit={onEdit}
                    onDetailEdit={onDetailEdit}
                    onDelete={onDelete}
                    onSoldOut={onSoldOut}
                    onToggleVisibility={onToggleVisibility}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
