import { DISPLAY_CATEGORY_OPTIONS } from '../../../../../lib/adminProductStatus'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { DisplayCategory } from '../../../../../types/displayCategory'
import type { Gender } from '../../../../../types/gender'
import type { ProductStatus } from '../../../../../types/status'
import {
  adminCardClassName,
  adminInputClassName,
  adminLabelClassName,
  adminPageStackClassName,
} from '../adminFormStyles'
import { AdminPricingFields } from './AdminPricingFields'

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: 'women', label: '여성' },
  { value: 'men', label: '남성' },
  { value: 'common', label: '공통' },
]

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
          <label htmlFor="detail-display-category" className={adminLabelClassName}>
            카테고리
          </label>
          <select
            id="detail-display-category"
            value={form.display_category}
            onChange={(event) =>
              onChange('display_category', event.target.value as DisplayCategory)
            }
            className={adminInputClassName}
          >
            {DISPLAY_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="detail-gender" className={adminLabelClassName}>
            성별
          </label>
          <select
            id="detail-gender"
            value={form.gender}
            onChange={(event) => onChange('gender', event.target.value as Gender)}
            className={adminInputClassName}
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
