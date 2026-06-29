interface ProductExposureSettingsProps {
  isNew: boolean
  isBest: boolean
  isSale: boolean
  onChange: (field: 'isNew' | 'isBest' | 'isSale', value: boolean) => void
  disabled?: boolean
}

const checkboxClassName =
  'h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900'

export function ProductExposureSettings({
  isNew,
  isBest,
  isSale,
  onChange,
  disabled = false,
}: ProductExposureSettingsProps) {
  return (
    <fieldset className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <legend className="px-1 text-sm font-semibold text-neutral-900">노출 설정</legend>
      <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
        운영자가 직접 지정한 상품만 각 페이지에 노출됩니다.
      </p>
      <div className="mt-4 space-y-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={isNew}
            disabled={disabled}
            onChange={(event) => onChange('isNew', event.target.checked)}
            className={checkboxClassName}
          />
          신상품 노출
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={isBest}
            disabled={disabled}
            onChange={(event) => onChange('isBest', event.target.checked)}
            className={checkboxClassName}
          />
          인기상품 노출
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={isSale}
            disabled={disabled}
            onChange={(event) => onChange('isSale', event.target.checked)}
            className={checkboxClassName}
          />
          특가상품 노출
        </label>
      </div>
    </fieldset>
  )
}
