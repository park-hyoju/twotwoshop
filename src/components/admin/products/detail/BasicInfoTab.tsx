import { PRODUCT_STATUS_OPTIONS } from '../../../../lib/adminProductStatus'
import type { AdminProductDetailForm } from '../../../../types/adminProductDetail'
import type { ProductCategoryId } from '../../../../constants/productCategories'
import type { ProductStatus } from '../../../../types/status'
import { ProductCategorySelect } from '../ProductCategorySelect'
import { adminInputClassName, adminLabelClassName, adminSectionClassName } from './adminFormStyles'

interface BasicInfoTabProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function BasicInfoTab({ form, onChange }: BasicInfoTabProps) {
  return (
    <div className={`${adminSectionClassName} space-y-4`}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="detail-name" className={adminLabelClassName}>
            상품명
          </label>
          <input
            id="detail-name"
            value={form.name}
            onChange={(event) => onChange('name', event.target.value)}
            className={adminInputClassName}
          />
        </div>
        <div>
          <label htmlFor="detail-slug" className={adminLabelClassName}>
            slug
          </label>
          <input
            id="detail-slug"
            value={form.slug}
            onChange={(event) => onChange('slug', event.target.value)}
            className={adminInputClassName}
          />
        </div>
        <div>
          <label htmlFor="detail-brand" className={adminLabelClassName}>
            브랜드
          </label>
          <input
            id="detail-brand"
            value={form.brand}
            onChange={(event) => onChange('brand', event.target.value)}
            className={adminInputClassName}
          />
        </div>
        <div>
          <label htmlFor="detail-sku" className={adminLabelClassName}>
            상품코드(SKU)
          </label>
          <input
            id="detail-sku"
            value={form.sku}
            onChange={(event) => onChange('sku', event.target.value)}
            className={adminInputClassName}
          />
        </div>
        <div>
          <label htmlFor="detail-product-category" className={adminLabelClassName}>
            카테고리
          </label>
          <ProductCategorySelect
            id="detail-product-category"
            value={form.product_category}
            onChange={(value: ProductCategoryId) => onChange('product_category', value)}
            className={adminInputClassName}
            required
          />
        </div>
        <div>
          <label htmlFor="detail-status" className={adminLabelClassName}>
            상태
          </label>
          <select
            id="detail-status"
            value={form.status}
            onChange={(event) => onChange('status', event.target.value as ProductStatus)}
            className={adminInputClassName}
          >
            {PRODUCT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 border-t border-neutral-200 pt-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="detail-price" className={adminLabelClassName}>
            판매가
          </label>
          <input
            id="detail-price"
            type="number"
            min={0}
            value={form.price}
            onChange={(event) => onChange('price', Number(event.target.value))}
            className={adminInputClassName}
          />
        </div>
        <div>
          <label htmlFor="detail-original-price" className={adminLabelClassName}>
            소비자가
          </label>
          <input
            id="detail-original-price"
            type="number"
            min={0}
            value={form.original_price}
            onChange={(event) => onChange('original_price', Number(event.target.value))}
            className={adminInputClassName}
          />
        </div>
        <div>
          <label htmlFor="detail-discount-rate" className={adminLabelClassName}>
            할인율(%)
          </label>
          <input
            id="detail-discount-rate"
            type="number"
            min={0}
            max={100}
            value={form.discount_rate}
            onChange={(event) => onChange('discount_rate', Number(event.target.value))}
            className={adminInputClassName}
          />
        </div>
        <div>
          <label htmlFor="detail-stock" className={adminLabelClassName}>
            재고
          </label>
          <input
            id="detail-stock"
            type="number"
            min={0}
            value={form.stock}
            onChange={(event) => onChange('stock', Number(event.target.value))}
            className={adminInputClassName}
          />
        </div>
      </div>
    </div>
  )
}
