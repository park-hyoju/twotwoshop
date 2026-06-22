import { EMPTY_SIZE_GUIDE_ROW } from '../../../../lib/adminProductDetailDefaults'
import type { AdminProductDetailForm, AdminSizeGuideRow } from '../../../../types/adminProductDetail'
import { adminCardClassName, adminLabelClassName, adminSectionTitleClassName, adminTextareaClassName } from './adminFormStyles'

interface SizeGuideTabProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

const SIZE_COLUMNS: Array<{ key: keyof AdminSizeGuideRow; label: string }> = [
  { key: 'size', label: '사이즈' },
  { key: 'total_length', label: '총장' },
  { key: 'shoulder', label: '어깨' },
  { key: 'chest', label: '가슴' },
  { key: 'sleeve', label: '소매' },
  { key: 'waist', label: '허리' },
  { key: 'hip', label: '엉덩이' },
  { key: 'rise', label: '밑위' },
  { key: 'thigh', label: '허벅지' },
  { key: 'hem', label: '밑단' },
]

export function SizeGuideTab({ form, onChange }: SizeGuideTabProps) {
  function updateRow(index: number, key: keyof AdminSizeGuideRow, value: string) {
    const rows = form.size_guide.rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [key]: value } : row,
    )
    onChange('size_guide', { ...form.size_guide, rows })
  }

  function addRow() {
    onChange('size_guide', {
      ...form.size_guide,
      rows: [...form.size_guide.rows, { ...EMPTY_SIZE_GUIDE_ROW }],
    })
  }

  function removeRow(index: number) {
    onChange('size_guide', {
      ...form.size_guide,
      rows: form.size_guide.rows.filter((_, rowIndex) => rowIndex !== index),
    })
  }

  return (
    <div className={`${adminCardClassName} space-y-6`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className={adminSectionTitleClassName}>사이즈 가이드</h3>
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          행 추가
        </button>
      </div>

      {form.size_guide.rows.length === 0 ? (
        <p className="text-sm text-neutral-500">등록된 사이즈 정보가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-neutral-50">
                {SIZE_COLUMNS.map((column) => (
                  <th key={column.key} className="px-2 py-2 text-left font-medium text-neutral-700">
                    {column.label}
                  </th>
                ))}
                <th className="px-2 py-2 text-left">관리</th>
              </tr>
            </thead>
            <tbody>
              {form.size_guide.rows.map((row, index) => (
                <tr key={index} className="border-t border-neutral-200">
                  {SIZE_COLUMNS.map((column) => (
                    <td key={column.key} className="px-2 py-2">
                      <input
                        value={row[column.key]}
                        onChange={(event) => updateRow(index, column.key, event.target.value)}
                        className="min-w-16 rounded border border-neutral-300 px-2 py-1"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-sm text-red-600"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <label htmlFor="detail-model-info" className={adminLabelClassName}>
          모델 착용 정보
        </label>
        <textarea
          id="detail-model-info"
          value={form.size_guide.model_info}
          onChange={(event) =>
            onChange('size_guide', { ...form.size_guide, model_info: event.target.value })
          }
          rows={4}
          className={`${adminTextareaClassName} resize-y`}
        />
      </div>
    </div>
  )
}
