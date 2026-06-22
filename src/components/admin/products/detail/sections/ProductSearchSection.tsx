import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import {
  adminCardClassName,
  adminInputClassName,
  adminLabelClassName,
  adminTextareaClassName,
} from '../adminFormStyles'

interface ProductSearchSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function ProductSearchSection({ form, onChange }: ProductSearchSectionProps) {
  return (
    <details className={adminCardClassName}>
      <summary className="cursor-pointer list-none text-lg font-bold text-neutral-900 marker:content-none">
        <div className="flex items-center justify-between gap-3">
          <span>▼ 검색노출 설정</span>
          <span className="text-sm font-medium text-neutral-400">펼치기</span>
        </div>
        <p className="mt-2 text-sm font-normal text-neutral-500">
          검색엔진·상품 주소 설정은 필요할 때만 수정하세요.
        </p>
      </summary>

      <div className="mt-6 grid gap-6 border-t border-neutral-100 pt-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="editor-meta-title" className={adminLabelClassName}>
            Meta Title
          </label>
          <input
            id="editor-meta-title"
            value={form.meta_title}
            onChange={(event) => onChange('meta_title', event.target.value)}
            className={adminInputClassName}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="editor-meta-description" className={adminLabelClassName}>
            Meta Description
          </label>
          <textarea
            id="editor-meta-description"
            value={form.meta_description}
            onChange={(event) => onChange('meta_description', event.target.value)}
            rows={4}
            className={`${adminTextareaClassName} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="editor-slug" className={adminLabelClassName}>
            상품 주소 (slug)
          </label>
          <input
            id="editor-slug"
            value={form.slug}
            onChange={(event) => onChange('slug', event.target.value)}
            className={adminInputClassName}
          />
        </div>

        <div>
          <label htmlFor="editor-sku" className={adminLabelClassName}>
            상품코드 (SKU)
          </label>
          <input
            id="editor-sku"
            value={form.sku}
            onChange={(event) => onChange('sku', event.target.value)}
            className={adminInputClassName}
          />
        </div>
      </div>
    </details>
  )
}
