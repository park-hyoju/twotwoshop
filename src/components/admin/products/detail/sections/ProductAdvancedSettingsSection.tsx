import type { DetailCategory } from '../../../../../types/detailCategory'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { Gender } from '../../../../../types/gender'
import {
  adminInputClassName,
  adminLabelClassName,
  adminTextareaClassName,
} from '../adminFormStyles'
import { ProductInfoTab } from '../ProductInfoTab'

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

interface ProductAdvancedSettingsSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
  embedded?: boolean
}

export function ProductAdvancedSettingsSection({
  form,
  onChange,
  embedded = false,
}: ProductAdvancedSettingsSectionProps) {
  const content = (
    <div className="space-y-8">
      <p className="text-sm text-neutral-500">
        검색·주소·상품정보고시 등 필요할 때만 수정하세요.
      </p>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="advanced-gender" className={adminLabelClassName}>
            성별
          </label>
          <select
            id="advanced-gender"
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

        <div className="sm:col-span-2">
          <label htmlFor="advanced-meta-title" className={adminLabelClassName}>
            검색 제목
          </label>
          <input
            id="advanced-meta-title"
            value={form.meta_title}
            onChange={(event) => onChange('meta_title', event.target.value)}
            className={adminInputClassName}
            placeholder="검색 결과에 보이는 제목"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="advanced-meta-description" className={adminLabelClassName}>
            검색 설명
          </label>
          <textarea
            id="advanced-meta-description"
            value={form.meta_description}
            onChange={(event) => onChange('meta_description', event.target.value)}
            rows={3}
            className={`${adminTextareaClassName} resize-y`}
            placeholder="검색 결과에 보이는 짧은 설명"
          />
        </div>

        <div>
          <label htmlFor="advanced-slug" className={adminLabelClassName}>
            상품 주소
          </label>
          <input
            id="advanced-slug"
            value={form.slug}
            onChange={(event) => onChange('slug', event.target.value)}
            className={adminInputClassName}
            placeholder="영문-주소"
          />
        </div>

        <div>
          <label htmlFor="advanced-sku" className={adminLabelClassName}>
            내부 상품코드
          </label>
          <input
            id="advanced-sku"
            value={form.sku}
            onChange={(event) => onChange('sku', event.target.value)}
            className={adminInputClassName}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="advanced-detail-category" className={adminLabelClassName}>
            세부 분류
          </label>
          <select
            id="advanced-detail-category"
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
      </div>

      <div>
        <p className="mb-4 text-sm font-semibold text-neutral-700">상품정보고시</p>
        <ProductInfoTab form={form} onChange={onChange} />
      </div>
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <details className="border-t border-neutral-100 pt-10">
      <summary className="cursor-pointer list-none text-sm font-semibold text-neutral-500 marker:content-none">
        고급설정
      </summary>
      <div className="mt-8">{content}</div>
    </details>
  )
}
