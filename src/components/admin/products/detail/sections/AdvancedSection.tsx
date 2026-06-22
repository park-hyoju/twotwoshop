import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import {
  adminCardClassName,
  adminInputClassName,
  adminLabelClassName,
  adminTextareaClassName,
} from '../adminFormStyles'

interface AdvancedSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function AdvancedSection({ form, onChange }: AdvancedSectionProps) {
  return (
    <details className={`${adminCardClassName} group`} open={false}>
      <summary className="cursor-pointer list-none text-lg font-bold text-neutral-900 marker:content-none">
        <div className="flex items-center justify-between gap-3">
          <span>고급 설정</span>
          <span className="text-sm font-medium text-neutral-400 group-open:hidden">펼치기</span>
          <span className="hidden text-sm font-medium text-neutral-400 group-open:inline">
            접기
          </span>
        </div>
        <p className="mt-2 text-sm font-normal text-neutral-500">
          URL 주소, 상품코드, 검색엔진(SEO) 설정은 필요할 때만 수정하세요.
        </p>
      </summary>

      <div className="mt-6 space-y-6 border-t border-neutral-100 pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="detail-slug" className={adminLabelClassName}>
              상품 주소 (slug)
            </label>
            <input
              id="detail-slug"
              value={form.slug}
              onChange={(event) => onChange('slug', event.target.value)}
              className={adminInputClassName}
            />
          </div>
          <div>
            <label htmlFor="detail-sku" className={adminLabelClassName}>
              상품코드 (SKU)
            </label>
            <input
              id="detail-sku"
              value={form.sku}
              onChange={(event) => onChange('sku', event.target.value)}
              className={adminInputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="detail-meta-title" className={adminLabelClassName}>
            검색 제목 (Meta Title)
          </label>
          <input
            id="detail-meta-title"
            value={form.meta_title}
            onChange={(event) => onChange('meta_title', event.target.value)}
            className={adminInputClassName}
          />
        </div>

        <div>
          <label htmlFor="detail-meta-description" className={adminLabelClassName}>
            검색 설명 (Meta Description)
          </label>
          <textarea
            id="detail-meta-description"
            value={form.meta_description}
            onChange={(event) => onChange('meta_description', event.target.value)}
            rows={5}
            className={`${adminTextareaClassName} resize-y`}
          />
        </div>
      </div>
    </details>
  )
}
