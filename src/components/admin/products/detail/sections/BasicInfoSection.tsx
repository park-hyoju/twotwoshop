import type { ProductCategoryId } from '../../../../../constants/productCategories'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { ProductStatus } from '../../../../../types/status'
import { ProductCategorySelect } from '../../ProductCategorySelect'
import {
  adminCardClassName,
  adminInputClassName,
  adminLabelClassName,
  adminPageStackClassName,
} from '../adminFormStyles'
import { AdminPricingFields } from './AdminPricingFields'

const SALE_STATUS_OPTIONS: Array<{ value: ProductStatus; label: string }> = [
  { value: 'active', label: '판매중' },
  { value: 'soldout', label: '품절' },
  { value: 'hidden', label: '숨김' },
]

interface BasicInfoSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
  hidePricingCard?: boolean
  simple?: boolean
}

export function BasicInfoSection({
  form,
  onChange,
  hidePricingCard = false,
  simple = false,
}: BasicInfoSectionProps) {
  return (
    <div className={hidePricingCard ? '' : adminPageStackClassName}>
      <section className={`${adminCardClassName} grid gap-6 md:grid-cols-2`}>
        <div className="md:col-span-2">
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

        <div className="md:col-span-2">
          <label htmlFor="detail-status" className={adminLabelClassName}>
            판매상태
          </label>
          <select
            id="detail-status"
            value={form.status}
            onChange={(event) => onChange('status', event.target.value as ProductStatus)}
            className={adminInputClassName}
          >
            {SALE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="detail-brand" className="text-sm text-neutral-500">
            브랜드 <span className="font-normal">(선택)</span>
          </label>
          <input
            id="detail-brand"
            value={form.brand}
            onChange={(event) => onChange('brand', event.target.value)}
            className={`${adminInputClassName} mt-1`}
            placeholder="브랜드가 있으면 입력하세요"
          />
        </div>
      </section>

      {!hidePricingCard && !simple && (
        <section className={adminCardClassName}>
          <AdminPricingFields form={form} onChange={onChange} />
        </section>
      )}
    </div>
  )
}
