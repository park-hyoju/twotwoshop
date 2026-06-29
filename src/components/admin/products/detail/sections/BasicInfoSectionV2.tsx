import type { ProductCategoryId } from '../../../../../constants/productCategories'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { ProductStatus } from '../../../../../types/status'
import { ProductCategorySelect } from '../../ProductCategorySelect'
import { adminInputClassName, adminLabelClassName } from '../adminFormStyles'

interface BasicInfoSectionV2Props {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

const STATUS_OPTIONS: Array<{ value: ProductStatus; label: string }> = [
  { value: 'active', label: '판매중' },
  { value: 'hidden', label: '숨김' },
]

function computeDiscountRate(price: number, originalPrice: number): number {
  if (originalPrice <= 0 || price <= 0 || price >= originalPrice) {
    return 0
  }

  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

export function BasicInfoSectionV2({ form, onChange }: BasicInfoSectionV2Props) {
  const discountRate = computeDiscountRate(form.price, form.original_price)

  function handlePriceChange(value: number) {
    onChange('price', value)
    onChange('discount_rate', computeDiscountRate(value, form.original_price))
  }

  function handleOriginalPriceChange(value: number) {
    onChange('original_price', value)
    onChange('discount_rate', computeDiscountRate(form.price, value))
  }

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="v2-product-name" className={adminLabelClassName}>
          상품명
        </label>
        <input
          id="v2-product-name"
          value={form.name}
          onChange={(event) => onChange('name', event.target.value)}
          className={adminInputClassName}
          placeholder="상품 이름을 입력하세요"
        />
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="v2-product-price" className={adminLabelClassName}>
            판매가
          </label>
          <input
            id="v2-product-price"
            type="number"
            min={0}
            value={form.price}
            onChange={(event) => handlePriceChange(Number(event.target.value))}
            className={adminInputClassName}
          />
        </div>

        <div>
          <label htmlFor="v2-product-original-price" className={adminLabelClassName}>
            소비자가
          </label>
          <input
            id="v2-product-original-price"
            type="number"
            min={0}
            value={form.original_price}
            onChange={(event) => handleOriginalPriceChange(Number(event.target.value))}
            className={adminInputClassName}
          />
        </div>
      </div>

      <div>
        <p className={adminLabelClassName}>할인율</p>
        <div className={`${adminInputClassName} flex items-center bg-neutral-50 text-neutral-800`}>
          {discountRate > 0 ? `${discountRate}%` : '할인 없음'}
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="v2-product-stock" className={adminLabelClassName}>
            재고
          </label>
          <input
            id="v2-product-stock"
            type="number"
            min={0}
            value={form.stock}
            onChange={(event) => onChange('stock', Number(event.target.value))}
            className={adminInputClassName}
          />
        </div>

        <div>
          <label htmlFor="v2-product-category" className={adminLabelClassName}>
            카테고리
          </label>
          <ProductCategorySelect
            id="v2-product-category"
            value={form.product_category}
            onChange={(value: ProductCategoryId) => onChange('product_category', value)}
            className={adminInputClassName}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="v2-product-status" className={adminLabelClassName}>
          상태
        </label>
        <select
          id="v2-product-status"
          value={form.status === 'hidden' ? 'hidden' : 'active'}
          onChange={(event) => onChange('status', event.target.value as ProductStatus)}
          className={adminInputClassName}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
