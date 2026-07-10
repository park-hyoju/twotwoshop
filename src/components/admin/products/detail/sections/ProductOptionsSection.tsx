import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildVariantsFromOptionGroups,
  formatVariantOptionLabel,
  getDisplayedVariantTotalStock,
  getVariantOptionKey,
  getVariantTotalStock,
  resolveVariantStocksFromDraft,
} from '../../../../../lib/adminProductOptions'
import {
  formatAdminNumericInput,
  parseAdminNumericInput,
} from '../../../../../lib/adminNumericInput'
import type {
  AdminProductDetailForm,
  AdminProductOptionGroup,
  AdminProductVariant,
} from '../../../../../types/adminProductDetail'
import { createOptionGroupId } from '../../../../../types/productOptions'
import { adminInputClassName, adminLabelClassName, adminSectionClassName } from '../adminFormStyles'

interface ProductOptionsSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
  onBatchChange?: (patch: Partial<AdminProductDetailForm>) => void
  onVariantStockDraftChange?: (draft: Record<string, string>) => void
}

const OPTION_SYNC_DEBOUNCE_MS = 250

function buildStockDraft(rows: AdminProductVariant[]): Record<string, string> {
  return Object.fromEntries(rows.map((row) => [row.id, formatAdminNumericInput(row.stock)]))
}

function createBlankOptionGroup(index: number): AdminProductOptionGroup {
  return {
    id: createOptionGroupId(),
    name: index === 0 ? '색상' : index === 1 ? '사이즈' : '',
    valuesInput: '',
  }
}

/** 첫 옵션 추가 시 색상·사이즈 두 그룹을 바로 보여줍니다. */
function createInitialOptionGroups(): AdminProductOptionGroup[] {
  return [createBlankOptionGroup(0), createBlankOptionGroup(1)]
}

function stockByVariantIdFromDraft(
  rows: AdminProductVariant[],
  stockInputs: Record<string, string>,
): Record<string, number> {
  return Object.fromEntries(
    resolveVariantStocksFromDraft(rows, stockInputs).map((row) => [row.id, row.stock]),
  )
}

function buildVariantsSignature(rows: AdminProductVariant[]): string {
  return rows
    .map((row) => `${row.id}:${getVariantOptionKey(row.options)}:${row.stock}`)
    .join('|')
}

function buildVariantKeysSignature(rows: AdminProductVariant[]): string {
  return rows.map((row) => getVariantOptionKey(row.options)).join(',')
}

export function ProductOptionsSection({
  form,
  onChange,
  onBatchChange,
  onVariantStockDraftChange,
}: ProductOptionsSectionProps) {
  const rows = form.variants
  const groups = form.optionGroups
  const groupNames = useMemo(
    () => groups.map((group) => group.name.trim()).filter(Boolean),
    [groups],
  )
  const groupsSignature = useMemo(
    () => groups.map((group) => `${group.id}:${group.name}:${group.valuesInput}`).join('|'),
    [groups],
  )
  const variantsSignature = useMemo(() => buildVariantsSignature(rows), [rows])

  const [stockInputs, setStockInputs] = useState<Record<string, string>>(() => buildStockDraft(rows))
  const [bulkStockInput, setBulkStockInput] = useState('')
  const rowsRef = useRef(rows)
  const stockInputsRef = useRef(stockInputs)

  rowsRef.current = rows
  stockInputsRef.current = stockInputs

  /** 옵션값 입력 즉시 조합 미리보기 (form 반영 전에도 표 표시) */
  const tableVariants = useMemo(() => {
    if (groups.length === 0) {
      return rows
    }

    const built = buildVariantsFromOptionGroups(
      groups,
      rows,
      stockByVariantIdFromDraft(rows, stockInputs),
    )

    return built.length > 0 ? built : rows
  }, [groups, rows, stockInputs])

  const applyFormPatch = useCallback(
    (patch: Partial<AdminProductDetailForm>) => {
      if (onBatchChange) {
        onBatchChange(patch)
        return
      }

      for (const [field, value] of Object.entries(patch) as Array<
        [keyof AdminProductDetailForm, AdminProductDetailForm[keyof AdminProductDetailForm]]
      >) {
        onChange(field, value)
      }
    },
    [onBatchChange, onChange],
  )

  useEffect(() => {
    const nextStock = buildStockDraft(form.variants)
    setStockInputs(nextStock)
    onVariantStockDraftChange?.(nextStock)
  }, [form.id, variantsSignature, onVariantStockDraftChange, form.variants])

  // 옵션 그룹 편집 중에는 normalize로 optionGroups를 덮어쓰지 않습니다.
  // (빈 사이즈 그룹이 사라지는 원인). variants만 동기화합니다.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (groups.length === 0) {
        if (rowsRef.current.length > 0) {
          applyFormPatch({ variants: [], stock: 0 })
          const nextDraft = {}
          setStockInputs(nextDraft)
          onVariantStockDraftChange?.(nextDraft)
        }
        return
      }

      const nextVariants = buildVariantsFromOptionGroups(
        groups,
        rowsRef.current,
        stockByVariantIdFromDraft(rowsRef.current, stockInputsRef.current),
      )
      const currentKeys = buildVariantKeysSignature(rowsRef.current)
      const nextKeys = buildVariantKeysSignature(nextVariants)

      if (currentKeys === nextKeys) {
        return
      }

      const nextDraft = buildStockDraft(nextVariants)
      applyFormPatch({
        variants: nextVariants,
        stock: getVariantTotalStock(nextVariants),
      })
      setStockInputs(nextDraft)
      onVariantStockDraftChange?.(nextDraft)
    }, OPTION_SYNC_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [groups, groupsSignature, form.id, applyFormPatch, onVariantStockDraftChange])

  const displayedTotalStock = useMemo(
    () => getDisplayedVariantTotalStock(tableVariants, stockInputs),
    [tableVariants, stockInputs],
  )

  function publishStockDraft(next: Record<string, string>) {
    setStockInputs(next)
    onVariantStockDraftChange?.(next)

    const currentRows = tableVariants.length > 0 ? tableVariants : rowsRef.current
    if (currentRows.length > 0) {
      const variants = resolveVariantStocksFromDraft(currentRows, next)
      applyFormPatch({
        variants,
        stock: getVariantTotalStock(variants),
      })
    }
  }

  function setOptionGroups(nextGroups: AdminProductOptionGroup[]) {
    applyFormPatch({ optionGroups: nextGroups })
  }

  function updateGroup(id: string, patch: Partial<AdminProductOptionGroup>) {
    setOptionGroups(groups.map((group) => (group.id === id ? { ...group, ...patch } : group)))
  }

  function addGroup() {
    if (groups.length === 0) {
      setOptionGroups(createInitialOptionGroups())
      return
    }

    setOptionGroups([...groups, createBlankOptionGroup(groups.length)])
  }

  function removeGroup(id: string) {
    setOptionGroups(groups.filter((group) => group.id !== id))
  }

  function handleStockInputChange(id: string, value: string) {
    publishStockDraft({ ...stockInputs, [id]: value })
  }

  function applyBulkStock() {
    const stock = parseAdminNumericInput(bulkStockInput)
    publishStockDraft(
      Object.fromEntries(tableVariants.map((row) => [row.id, formatAdminNumericInput(stock)])),
    )
  }

  const showStockTable = tableVariants.length > 0

  return (
    <div className={`${adminSectionClassName} space-y-5`}>
      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center">
          <p className="text-sm text-neutral-600">옵션이 없으면 상품정보 탭에서 재고를 입력합니다.</p>
          <button
            type="button"
            onClick={addGroup}
            className="mt-4 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            + 옵션 추가
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, index) => (
            <div key={group.id} className="space-y-2 rounded-xl border border-neutral-200 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={adminLabelClassName}>옵션명</label>
                  <input
                    value={group.name}
                    onChange={(event) => updateGroup(group.id, { name: event.target.value })}
                    className={adminInputClassName}
                    placeholder={index === 0 ? '색상' : index === 1 ? '사이즈' : '옵션 종류'}
                  />
                </div>
                <div>
                  <label className={adminLabelClassName}>옵션값</label>
                  <input
                    value={group.valuesInput}
                    onChange={(event) => updateGroup(group.id, { valuesInput: event.target.value })}
                    className={adminInputClassName}
                    placeholder={index === 0 ? '네이비, 화이트, 블랙' : '95, 100, 105'}
                  />
                </div>
              </div>

              {groups.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGroup(group.id)}
                  className="text-xs font-medium text-neutral-500 hover:text-red-600"
                >
                  이 옵션 삭제
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addGroup}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            + 옵션 추가
          </button>
        </div>
      )}

      {showStockTable && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className={adminLabelClassName}>총 재고</p>
            <p className="text-lg font-bold text-neutral-900" aria-live="polite">
              {displayedTotalStock}개
            </p>
            <p className="mt-1 text-xs text-neutral-500">옵션별 재고 합산 (자동 계산, 직접 수정 불가)</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-600">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">옵션</th>
                  <th className="w-28 px-4 py-2.5 font-semibold">재고</th>
                </tr>
              </thead>
              <tbody>
                {tableVariants.map((row) => (
                  <tr key={row.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2.5 text-neutral-800">
                      {formatVariantOptionLabel(row, groupNames)}
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min={0}
                        value={stockInputs[row.id] ?? ''}
                        onChange={(event) => handleStockInputChange(row.id, event.target.value)}
                        className={`${adminInputClassName} w-full`}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
            <div className="min-w-0 flex-1">
              <label className={adminLabelClassName}>전체 옵션 재고 일괄 입력</label>
              <input
                type="number"
                min={0}
                value={bulkStockInput}
                onChange={(event) => setBulkStockInput(event.target.value)}
                className={`${adminInputClassName} w-full max-w-32`}
                placeholder="예: 32"
              />
              <p className="mt-1 text-xs text-neutral-500">
                입력 후 &quot;전체 적용&quot;을 눌러야 모든 옵션 재고가 변경됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={applyBulkStock}
              className="h-11 shrink-0 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              전체 적용
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { mergeVariantStockDraftIntoForm as applyVariantStockDraftToForm } from '../editor/productSaveChanges'
