import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import {
  adminCardClassName,
  adminInputClassName,
  adminPageStackClassName,
  adminSectionTitleClassName,
  adminTextareaClassName,
} from '../adminFormStyles'
import { ProductInfoTab } from '../ProductInfoTab'
import { SizeGuideTab } from '../SizeGuideTab'

interface DescriptionSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function DescriptionSection({ form, onChange }: DescriptionSectionProps) {
  return (
    <div className={adminPageStackClassName}>
      <section className={adminCardClassName}>
        <h3 className={`${adminSectionTitleClassName} mb-6`}>짧은 설명</h3>
        <label htmlFor="detail-short-description" className="sr-only">
          짧은 설명
        </label>
        <input
          id="detail-short-description"
          value={form.short_description}
          onChange={(event) => onChange('short_description', event.target.value)}
          className={adminInputClassName}
          placeholder="목록과 상단에 보이는 한 줄 소개"
        />
      </section>

      <section className={adminCardClassName}>
        <h3 className={`${adminSectionTitleClassName} mb-6`}>상세 설명</h3>
        <label htmlFor="detail-description" className="sr-only">
          상세 설명
        </label>
        <textarea
          id="detail-description"
          value={form.description}
          onChange={(event) => onChange('description', event.target.value)}
          rows={18}
          className={`${adminTextareaClassName} min-h-[22rem] resize-y`}
          placeholder="상품 상세 페이지에 노출될 설명을 입력하세요"
        />
      </section>

      <SizeGuideTab form={form} onChange={onChange} />

      <section className={adminCardClassName}>
        <h3 className={`${adminSectionTitleClassName} mb-6`}>추가 정보</h3>
        <ProductInfoTab form={form} onChange={onChange} />
      </section>
    </div>
  )
}
