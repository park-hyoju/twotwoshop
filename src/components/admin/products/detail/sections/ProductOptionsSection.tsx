import type { AdminProductDetailForm, AdminProductVariant } from '../../../../../types/adminProductDetail'
import { adminInputClassName, adminLabelClassName, adminSectionClassName } from '../adminFormStyles'

interface ProductOptionsSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
}

function createOptionId(): string {
  return `option-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function ProductOptionsSection({ form, onChange }: ProductOptionsSectionProps) {
  const rows = form.variants

  function setRows(next: AdminProductVariant[]) {
    onChange('variants', next)
  }

  function addRow() {
    setRows([...rows, { id: createOptionId(), color: '', size: '', stock: 0 }])
  }

  function updateRow(id: string, patch: Partial<AdminProductVariant>) {
    setRows(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function removeRow(id: string) {
    setRows(rows.filter((row) => row.id !== id))
  }

  return (
    <div className={`${adminSectionClassName} space-y-5`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">색상·사이즈별 재고를 입력하세요.</p>
        <button
          type="button"
          onClick={addRow}
          className="shrink-0 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          옵션 추가
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
          옵션이 없으면 상품정보 탭의 재고를 사용합니다.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[1fr_1fr_120px_auto]"
            >
              <div>
                <label className={adminLabelClassName}>색상</label>
                <input
                  value={row.color}
                  onChange={(event) => updateRow(row.id, { color: event.target.value })}
                  className={adminInputClassName}
                  placeholder={`옵션 ${index + 1} 색상`}
                />
              </div>
              <div>
                <label className={adminLabelClassName}>사이즈</label>
                <input
                  value={row.size}
                  onChange={(event) => updateRow(row.id, { size: event.target.value })}
                  className={adminInputClassName}
                  placeholder="FREE, S, M..."
                />
              </div>
              <div>
                <label className={adminLabelClassName}>재고</label>
                <input
                  type="number"
                  min={0}
                  value={row.stock}
                  onChange={(event) =>
                    updateRow(row.id, { stock: Number.parseInt(event.target.value, 10) || 0 })
                  }
                  className={adminInputClassName}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="h-12 rounded-2xl border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
