import { PRODUCT_STATUS_OPTIONS } from '../../../../lib/adminProductStatus'
import type { AdminProductDetailForm } from '../../../../types/adminProductDetail'
import type { ProductCategoryId } from '../../../../constants/productCategories'
import type { ProductStatus } from '../../../../types/status'
import { ProductCategorySelect } from '../ProductCategorySelect'
import { ProductExposureSettings } from '../ProductExposureSettings'
import { adminInputClassName, adminLabelClassName, adminSectionClassName } from './adminFormStyles'
import { AdminPricingFields } from './sections/AdminPricingFields'

interface BasicInfoTabProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function BasicInfoTab({ form, onChange }: BasicInfoTabProps) {
  return (
    <div className={`${adminSectionClassName} space-y-6`}>
      <div>
        <label htmlFor="detail-name" className={adminLabelClassName}>
          상품명
        </label>
        <input
          id="detail-name"
          value={form.name}
          onChange={(event) => onChange('name', event.target.value)}
          className={adminInputClassName}
          placeholder="상품 이름을 입력하세요"
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

      <AdminPricingFields form={form} onChange={onChange} operator />

      <div>
        <label htmlFor="detail-status" className={adminLabelClassName}>
          판매 상태
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
