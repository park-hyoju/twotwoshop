import type { AdminProductDetailForm } from '../../../../types/adminProductDetail'
import { adminInputClassName, adminLabelClassName, adminSectionClassName } from './adminFormStyles'

interface SeoTabProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function SeoTab({ form, onChange }: SeoTabProps) {
  return (
    <div className={`${adminSectionClassName} space-y-4`}>
      <div>
        <label htmlFor="detail-meta-title" className={adminLabelClassName}>
          Meta Title
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
          Meta Description
        </label>
        <textarea
          id="detail-meta-description"
          value={form.meta_description}
          onChange={(event) => onChange('meta_description', event.target.value)}
          rows={6}
          className={`${adminInputClassName} resize-y`}
        />
      </div>
    </div>
  )
}
