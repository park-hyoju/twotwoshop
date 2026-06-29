import {
  getAdminCategorySelectOptions,
  isProductCategoryId,
  type ProductCategoryId,
} from '../../../constants/productCategories'

interface ProductCategorySelectProps {
  id?: string
  value: ProductCategoryId
  onChange: (value: ProductCategoryId) => void
  className?: string
  required?: boolean
}

export function ProductCategorySelect({
  id = 'product-category',
  value,
  onChange,
  className = '',
  required = false,
}: ProductCategorySelectProps) {
  const groups = getAdminCategorySelectOptions()

  return (
    <select
      id={id}
      required={required}
      value={value}
      onChange={(event) => {
        const nextValue = event.target.value
        if (isProductCategoryId(nextValue)) {
          onChange(nextValue)
        }
      }}
      className={className}
    >
      {groups.map((group) => (
        <optgroup key={group.group} label={group.groupLabel}>
          {group.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
