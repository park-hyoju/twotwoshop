import { useState } from 'react'
import { adminCardClassName, adminInputClassName, adminLabelClassName } from '../adminFormStyles'

export interface ProductOptionRow {
  id: string
  color: string
  size: string
}

function createOptionId(): string {
  return `option-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function ProductOptionsSection() {
  const [rows, setRows] = useState<ProductOptionRow[]>([])

  function addRow() {
    setRows((current) => [...current, { id: createOptionId(), color: '', size: '' }])
  }

  function updateRow(id: string, field: 'color' | 'size', value: string) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    )
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id))
  }

  return (
    <section className={adminCardClassName}>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">옵션</h3>
          <p className="mt-1 text-sm text-neutral-500">
            색상·사이즈 옵션 UI입니다. 추후 주문/재고 연동 시 이 구조를 확장합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="shrink-0 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          옵션 추가
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
          옵션이 없는 단일 상품입니다. 필요하면 옵션을 추가하세요.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <label className={adminLabelClassName}>색상</label>
                <input
                  value={row.color}
                  onChange={(event) => updateRow(row.id, 'color', event.target.value)}
                  className={adminInputClassName}
                  placeholder={`옵션 ${index + 1} 색상`}
                />
              </div>
              <div>
                <label className={adminLabelClassName}>사이즈</label>
                <input
                  value={row.size}
                  onChange={(event) => updateRow(row.id, 'size', event.target.value)}
                  className={adminInputClassName}
                  placeholder="FREE, S, M..."
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
    </section>
  )
}
