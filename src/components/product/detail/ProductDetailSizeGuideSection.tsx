import {
  getVisibleSizeGuideColumns,
  hasProductSizeGuide,
} from '../../../lib/productDetailContent'
import type { ProductSizeGuide } from '../../../types/productDetail'

interface ProductDetailSizeGuideSectionProps {
  sizeGuide: ProductSizeGuide
}

export function ProductDetailSizeGuideSection({ sizeGuide }: ProductDetailSizeGuideSectionProps) {
  if (!hasProductSizeGuide(sizeGuide)) {
    return null
  }

  const visibleColumns = getVisibleSizeGuideColumns(sizeGuide.rows)

  return (
    <div className="space-y-4">
      {visibleColumns.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="min-w-full text-sm text-neutral-800">
            <thead>
              <tr className="bg-neutral-50 text-left">
                {visibleColumns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-semibold text-neutral-700">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizeGuide.rows.map((row, rowIndex) => {
                const hasValues = visibleColumns.some((column) => row[column.key].trim())
                if (!hasValues) {
                  return null
                }

                return (
                  <tr key={rowIndex} className="border-t border-neutral-200">
                    {visibleColumns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        {row[column.key] || '-'}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {sizeGuide.model_info.trim() && (
        <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-600">
          {sizeGuide.model_info}
        </p>
      )}
    </div>
  )
}
