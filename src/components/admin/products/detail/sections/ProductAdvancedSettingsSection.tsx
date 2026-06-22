import type { DetailCategory } from '../../../../../types/detailCategory'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import {
  adminCardClassName,
  adminInputClassName,
  adminLabelClassName,
  adminTextareaClassName,
} from '../adminFormStyles'
import { ProductInfoTab } from '../ProductInfoTab'
import { SizeGuideTab } from '../SizeGuideTab'

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

interface ProductAdvancedSettingsSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function ProductAdvancedSettingsSection({ form, onChange }: ProductAdvancedSettingsSectionProps) {
  return (
    <details className={adminCardClassName}>
      <summary className="cursor-pointer list-none text-base font-bold text-neutral-700 marker:content-none">
        <div className="flex items-center justify-between gap-3">
          <span>고급설정</span>
          <span className="text-sm font-medium text-neutral-400">펼치기</span>
        </div>
        <p className="mt-2 text-sm font-normal text-neutral-500">
          검색·주소·사이즈표 등 필요할 때만 수정하세요.
        </p>
      </summary>

      <div className="mt-6 space-y-8 border-t border-neutral-100 pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
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

          <div className="md:col-span-2">
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

          <div className="md:col-span-2">
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

        <SizeGuideTab form={form} onChange={onChange} />
        <ProductInfoTab form={form} onChange={onChange} />
      </div>
    </details>
  )
}
