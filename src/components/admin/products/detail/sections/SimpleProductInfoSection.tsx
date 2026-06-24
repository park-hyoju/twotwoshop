import { DISPLAY_CATEGORY_OPTIONS } from '../../../../../lib/adminProductStatus'
import type { AdminProductDetailForm } from '../../../../../types/adminProductDetail'
import type { DisplayCategory } from '../../../../../types/displayCategory'
import { adminInputClassName, adminLabelClassName } from '../adminFormStyles'

interface SimpleProductInfoSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

export function SimpleProductInfoSection({ form, onChange }: SimpleProductInfoSectionProps) {
  function updateSize(value: string) {
    onChange('product_info', { ...form.product_info, fit: value })
  }

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="seller-product-name" className={adminLabelClassName}>
          상품명
        </label>
        <input
          id="seller-product-name"
          value={form.name}
          onChange={(event) => onChange('name', event.target.value)}
          className={adminInputClassName}
          placeholder="예) 오버핏 코튼 셔츠"
        />
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="seller-product-price" className={adminLabelClassName}>
            판매가
          </label>
          <input
            id="seller-product-price"
            type="number"
            min={0}
            value={form.price}
            onChange={(event) => {
              const price = Number(event.target.value)
              onChange('price', price)
              onChange('original_price', price)
              onChange('discount_rate', 0)
            }}
            className={adminInputClassName}
            placeholder="0"
          />
        </div>

        <div>
          <label htmlFor="seller-product-stock" className={adminLabelClassName}>
            재고
          </label>
          <input
            id="seller-product-stock"
            type="number"
            min={0}
            value={form.stock}
            onChange={(event) => onChange('stock', Number(event.target.value))}
            className={adminInputClassName}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label htmlFor="seller-product-category" className={adminLabelClassName}>
          카테고리
        </label>
        <select
          id="seller-product-category"
          value={form.display_category}
          onChange={(event) =>
            onChange('display_category', event.target.value as DisplayCategory)
          }
          className={adminInputClassName}
        >
          {DISPLAY_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="seller-product-color" className={adminLabelClassName}>
            색상
          </label>
          <input
            id="seller-product-color"
            value={form.brand}
            onChange={(event) => onChange('brand', event.target.value)}
            className={adminInputClassName}
            placeholder="예) 블랙, 화이트"
          />
        </div>

        <div>
          <label htmlFor="seller-product-size" className={adminLabelClassName}>
            사이즈
          </label>
          <input
            id="seller-product-size"
            value={form.product_info.fit}
            onChange={(event) => updateSize(event.target.value)}
            className={adminInputClassName}
            placeholder="예) S, M, L"
          />
        </div>
      </div>
    </div>
  )
}
