import type { ProductCategoryId } from '../../../../../constants/productCategories'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { ProductStatus } from '../../../../../types/status'
import { PRODUCT_STATUS_OPTIONS } from '../../../../../lib/adminProductStatus'
import { ProductCategorySelect } from '../../ProductCategorySelect'
import { ProductExposureSettings } from '../../ProductExposureSettings'
import { adminInputClassName, adminLabelClassName } from '../adminFormStyles'

interface ProductDetailBasicSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function ProductDetailBasicSection({ form, onChange }: ProductDetailBasicSectionProps) {
  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="detail-product-name" className={adminLabelClassName}>
          상품명
        </label>
        <input
          id="detail-product-name"
          value={form.name}
          onChange={(event) => onChange('name', event.target.value)}
          className={adminInputClassName}
          placeholder="예) 오버핏 코튼 셔츠"
        />
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
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
          <label htmlFor="detail-product-status" className={adminLabelClassName}>
            판매 상태
          </label>
          <select
            id="detail-product-status"
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

      <ProductExposureSettings
        isNew={form.isNew}
        isBest={form.isBest}
        isSale={form.isSale}
        onChange={(field, value) => {
          if (field === 'isNew') onChange('isNew', value)
          if (field === 'isBest') onChange('isBest', value)
          if (field === 'isSale') onChange('isSale', value)
        }}
      />
    </div>
  )
}
