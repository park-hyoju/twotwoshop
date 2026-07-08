interface ProductExposureSettingsProps {
  isNew: boolean
  isBest: boolean
  isSale: boolean
  onChange: (field: 'isNew' | 'isBest' | 'isSale', value: boolean) => void
  disabled?: boolean
}

const checkboxClassName =
  'h-5 w-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900'

export function ProductExposureSettings({
  isNew,
  isBest,
  isSale,
  onChange,
  disabled = false,
}: ProductExposureSettingsProps) {
  return (
    <fieldset>
      <legend className="mb-3 block text-sm font-semibold text-neutral-700">노출 위치</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={isNew}
            disabled={disabled}
            onChange={(event) => onChange('isNew', event.target.checked)}
            className={checkboxClassName}
          />
          신상품
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={isBest}
            disabled={disabled}
            onChange={(event) => onChange('isBest', event.target.checked)}
            className={checkboxClassName}
          />
          인기상품
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={isSale}
            disabled={disabled}
            onChange={(event) => onChange('isSale', event.target.checked)}
            className={checkboxClassName}
          />
          특가상품
        </label>
      </div>
    </fieldset>
  )
}
