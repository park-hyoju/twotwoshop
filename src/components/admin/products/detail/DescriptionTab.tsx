import type { AdminProductDetailForm } from '../../../../types/adminProductDetail'
import { adminInputClassName, adminLabelClassName, adminSectionClassName } from './adminFormStyles'

interface DescriptionTabProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function DescriptionTab({ form, onChange }: DescriptionTabProps) {
  return (
    <div className={`${adminSectionClassName} space-y-4`}>
      <div>
        <label htmlFor="detail-short-description" className={adminLabelClassName}>
          짧은 설명
        </label>
        <input
          id="detail-short-description"
          value={form.short_description}
          onChange={(event) => onChange('short_description', event.target.value)}
          className={adminInputClassName}
        />
      </div>

      <div>
        <label htmlFor="detail-description" className={adminLabelClassName}>
          상품 상세 설명
        </label>
        <textarea
          id="detail-description"
          value={form.description}
          onChange={(event) => onChange('description', event.target.value)}
          rows={16}
          className={`${adminInputClassName} min-h-64 resize-y`}
          placeholder="줄바꿈은 그대로 저장됩니다."
        />
        <p className="mt-2 text-sm text-neutral-500">줄바꿈은 고객 화면에서 그대로 표시됩니다.</p>
      </div>
    </div>
  )
}
