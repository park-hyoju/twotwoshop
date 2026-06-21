import {
  DISPLAY_CATEGORY_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
} from '../../../../lib/adminProductStatus'
import type { AdminProductDetailForm } from '../../../../types/adminProductDetail'
import type { DetailCategory } from '../../../../types/detailCategory'
import type { DisplayCategory } from '../../../../types/displayCategory'
import type { Gender } from '../../../../types/gender'
import type { ProductStatus } from '../../../../types/status'
import { adminInputClassName, adminLabelClassName, adminSectionClassName } from './adminFormStyles'

const DETAIL_CATEGORY_OPTIONS: DetailCategory[] = [
  'shirt',
  'knit',
  'hoodie',
  'tshirt',
  'pants',
  'dress',
  'sneakers',
  'loafers',
  'bag',
  'belt',
  'wallet',
  'cap',
  'accessory',
  'skirt',
  'socks',
  'etc',
]

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: 'women', label: '여성' },
  { value: 'men', label: '남성' },
  { value: 'common', label: '공통' },
]

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
          <label htmlFor="detail-detail-category" className={adminLabelClassName}>
            상세 카테고리
          </label>
          <select
            id="detail-detail-category"
            value={form.detail_category}
            onChange={(event) => onChange('detail_category', event.target.value as DetailCategory)}
            className={adminInputClassName}
          >
            {DETAIL_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
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
