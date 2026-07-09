import type {
  ProductDescriptionAlign,
  ProductDescriptionFontSize,
  ProductDescriptionFontWeight,
  ProductDescriptionFormat,
} from '../../../../../lib/productDescriptionFormat'
import { getProductDescriptionText } from '../../../../../lib/productDetailContent'
import { ProductDetailDescriptionSection } from '../../../../product/detail/ProductDetailDescriptionSection'
import {
  parseProductDescription,
  serializeProductDescription,
} from '../../../../../lib/productDescriptionFormat'
import { adminLabelClassName, adminTextareaClassName } from '../adminFormStyles'

interface ProductDescriptionEditorProps {
  value: string
  shortDescription?: string
  onChange: (value: string) => void
}

const FONT_SIZE_OPTIONS: Array<{ value: ProductDescriptionFontSize; label: string }> = [
  { value: 'small', label: '작게' },
  { value: 'normal', label: '보통' },
  { value: 'large', label: '크게' },
]

const FONT_WEIGHT_OPTIONS: Array<{ value: ProductDescriptionFontWeight; label: string }> = [
  { value: 'normal', label: '일반' },
  { value: 'bold', label: '굵게' },
]

const ALIGN_OPTIONS: Array<{ value: ProductDescriptionAlign; label: string }> = [
  { value: 'left', label: '왼쪽' },
  { value: 'center', label: '가운데' },
  { value: 'right', label: '오른쪽' },
]

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-neutral-900 text-white'
          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
      }`}
    >
      {children}
    </button>
  )
}

export function ProductDescriptionEditor({
  value,
  shortDescription = '',
  onChange,
}: ProductDescriptionEditorProps) {
  const format = parseProductDescription(value)
  const hasDescription = Boolean(getProductDescriptionText(shortDescription, value).trim())

  function updateFormat(next: Partial<ProductDescriptionFormat>) {
    onChange(serializeProductDescription({ ...format, ...next }))
  }

  return (
    <div className="space-y-3">
      <label htmlFor="detail-description" className={adminLabelClassName}>
        상품 설명
      </label>

      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FONT_SIZE_OPTIONS.map((option) => (
            <ToolbarButton
              key={option.value}
              active={format.fontSize === option.value}
              onClick={() => updateFormat({ fontSize: option.value })}
            >
              {option.label}
            </ToolbarButton>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FONT_WEIGHT_OPTIONS.map((option) => (
            <ToolbarButton
              key={option.value}
              active={format.fontWeight === option.value}
              onClick={() => updateFormat({ fontWeight: option.value })}
            >
              {option.label}
            </ToolbarButton>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ALIGN_OPTIONS.map((option) => (
            <ToolbarButton
              key={option.value}
              active={format.align === option.value}
              onClick={() => updateFormat({ align: option.value })}
            >
              {option.label}
            </ToolbarButton>
          ))}
        </div>
      </div>

      <textarea
        id="detail-description"
        value={format.text}
        onChange={(event) => updateFormat({ text: event.target.value })}
        rows={8}
        className={`${adminTextareaClassName} min-h-40 resize-y`}
        placeholder="상품 설명을 입력하세요"
      />

      <div className="border-t border-neutral-200 pt-6">
        <p className={adminLabelClassName}>고객 화면 미리보기</p>
        <p className="mt-1 text-sm text-neutral-500">
          쇼핑몰 상품 상세의 상품정보 탭과 동일한 스타일로 표시됩니다.
        </p>
        <div className="mx-auto mt-4 max-w-3xl pt-6 sm:pt-8" aria-live="polite">
          <div className="space-y-8">
            {hasDescription ? (
              <ProductDetailDescriptionSection
                shortDescription={shortDescription}
                description={value}
              />
            ) : (
              <p className="text-sm text-neutral-400">
                상품 설명을 입력하면 고객 화면에 이렇게 보입니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
