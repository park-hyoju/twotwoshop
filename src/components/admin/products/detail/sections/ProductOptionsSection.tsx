import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildOptionGroupsPayload,
  buildVariantsFromOptionGroups,
  formatVariantOptionLabel,
  getDisplayedVariantTotalStock,
  getVariantOptionKey,
  getVariantTotalStock,
  resolveVariantStockFromDraft,
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
import { createOptionGroupId, ensureUniqueOptionGroupIds } from '../../../../../types/productOptions'
import { adminInputClassName, adminLabelClassName, adminSectionClassName } from '../adminFormStyles'

interface ProductOptionsSectionProps {
  form: AdminProductDetailForm
  onChange: <K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) => void
  onBatchChange?: (
    patch:
      | Partial<AdminProductDetailForm>
      | ((current: AdminProductDetailForm) => Partial<AdminProductDetailForm>),
  ) => void
  onVariantStockDraftChange?: (draft: Record<string, string>) => void
}

const OPTION_SYNC_DEBOUNCE_MS = 200

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

function createInitialOptionGroups(): AdminProductOptionGroup[] {
  return [createBlankOptionGroup(0), createBlankOptionGroup(1)]
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
  // Local source of truth for option rows so color/size inputs never share stale parent state.
  const [groups, setGroups] = useState<AdminProductOptionGroup[]>(() =>
    ensureUniqueOptionGroupIds(form.optionGroups),
  )
  const groupNames = useMemo(
    () => groups.map((group) => group.name.trim()).filter(Boolean),
    [groups],
  )
  const groupsSignature = useMemo(
    () => groups.map((group) => `${group.id}:${group.name}:${group.valuesInput}`).join('|'),
    [groups],
  )

  const [stockInputs, setStockInputs] = useState<Record<string, string>>(() => buildStockDraft(rows))
  const [bulkStockInput, setBulkStockInput] = useState('')
  const rowsRef = useRef(rows)
  const stockInputsRef = useRef(stockInputs)
  const groupsRef = useRef(groups)

  rowsRef.current = rows
  stockInputsRef.current = stockInputs
  groupsRef.current = groups

  const applyFormPatch = useCallback(
    (
      patch:
        | Partial<AdminProductDetailForm>
        | ((current: AdminProductDetailForm) => Partial<AdminProductDetailForm>),
    ) => {
      if (onBatchChange) {
        onBatchChange(patch)
        return
      }
      const resolved = typeof patch === 'function' ? patch(form) : patch
      for (const [field, value] of Object.entries(resolved) as Array<
        [keyof AdminProductDetailForm, AdminProductDetailForm[keyof AdminProductDetailForm]]
      >) {
        onChange(field, value)
      }
    },
    // form is only needed for the non-batch fallback path
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keep stable when onBatchChange is provided
    [onBatchChange, onChange],
  )

  const tableVariantsRef = useRef<AdminProductVariant[]>([])

  const tableVariants = useMemo(() => {
    // Preserve typed stock across id regeneration by option key (색상+사이즈).
    const stockByOptionKey: Record<string, number> = {}
    for (const row of tableVariantsRef.current) {
      const key = getVariantOptionKey(row.options ?? {})
      if (!key) {
        continue
      }
      stockByOptionKey[key] = resolveVariantStockFromDraft(row, stockInputs)
    }
    for (const row of rows) {
      const key = getVariantOptionKey(row.options ?? {})
      if (!key) {
        continue
      }
      if (row.id in stockInputs) {
        stockByOptionKey[key] = resolveVariantStockFromDraft(row, stockInputs)
      } else if (!(key in stockByOptionKey)) {
        stockByOptionKey[key] = row.stock
      }
    }

    const built = buildVariantsFromOptionGroups(groups, rows).map((row) => {
      const key = getVariantOptionKey(row.options ?? {})
      if (key in stockByOptionKey) {
        return { ...row, stock: stockByOptionKey[key]! }
      }
      return row
    })
    tableVariantsRef.current = built
    return built
  }, [groups, groupsSignature, rows, stockInputs])

  useEffect(() => {
    const unique = ensureUniqueOptionGroupIds(form.optionGroups)
    setGroups(unique)
    groupsRef.current = unique
    if (unique !== form.optionGroups) {
      applyFormPatch({ optionGroups: unique })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on product load only
  }, [form.id])

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    const payload = buildOptionGroupsPayload(groups)
    console.groupCollapsed('[options-stock-table]')
    console.log(
      'optionGroups:',
      groups.map((group) => ({ name: group.name, valuesInput: group.valuesInput })),
    )
    console.log(
      'generated variants:',
      tableVariants.map((row) => ({ options: row.options, stock: row.stock })),
    )
    console.log('parsed payload', payload)
    console.log(
      'tableVariants labels',
      tableVariants.map((row) => formatVariantOptionLabel(row, groupNames)),
    )
    console.groupEnd()
  }, [groups, groupNames, tableVariants])

  useEffect(() => {
    const nextStock = buildStockDraft(form.variants)
    setStockInputs(nextStock)
    stockInputsRef.current = nextStock
    onVariantStockDraftChange?.(nextStock)
  }, [form.id, onVariantStockDraftChange])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (groupsRef.current.length === 0) {
        if (rowsRef.current.length > 0) {
          applyFormPatch({ variants: [], stock: 0 })
          const nextDraft = {}
          setStockInputs(nextDraft)
          stockInputsRef.current = nextDraft
          onVariantStockDraftChange?.(nextDraft)
        }
        return
      }

      const stockByOptionKey: Record<string, number> = {}
      for (const row of tableVariantsRef.current) {
        const key = getVariantOptionKey(row.options ?? {})
        if (!key) {
          continue
        }
        stockByOptionKey[key] = resolveVariantStockFromDraft(row, stockInputsRef.current)
      }
      for (const row of rowsRef.current) {
        const key = getVariantOptionKey(row.options ?? {})
        if (!key) {
          continue
        }
        if (row.id in stockInputsRef.current) {
          stockByOptionKey[key] = resolveVariantStockFromDraft(row, stockInputsRef.current)
        } else if (!(key in stockByOptionKey)) {
          stockByOptionKey[key] = row.stock
        }
      }

      const nextVariants = buildVariantsFromOptionGroups(groupsRef.current, rowsRef.current).map(
        (row) => {
          const key = getVariantOptionKey(row.options ?? {})
          if (key in stockByOptionKey) {
            return { ...row, stock: stockByOptionKey[key]! }
          }
          return row
        },
      )

      if (buildVariantKeysSignature(rowsRef.current) === buildVariantKeysSignature(nextVariants)) {
        // Keys unchanged — still sync stock onto form if draft advanced.
        const stockChanged =
          getVariantTotalStock(rowsRef.current) !== getVariantTotalStock(nextVariants) ||
          rowsRef.current.some((row, index) => row.stock !== nextVariants[index]?.stock)
        if (!stockChanged) {
          return
        }
      }

      const nextDraft = buildStockDraft(nextVariants)
      applyFormPatch({
        variants: nextVariants,
        stock: getVariantTotalStock(nextVariants),
      })
      setStockInputs(nextDraft)
      stockInputsRef.current = nextDraft
      onVariantStockDraftChange?.(nextDraft)
    }, OPTION_SYNC_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [groupsSignature, form.id, applyFormPatch, onVariantStockDraftChange])

  const displayedTotalStock = useMemo(
    () => getDisplayedVariantTotalStock(tableVariants, stockInputs),
    [tableVariants, stockInputs],
  )

  function publishStockDraft(next: Record<string, string>) {
    stockInputsRef.current = next
    setStockInputs(next)
    onVariantStockDraftChange?.(next)

    const currentRows = tableVariantsRef.current.length > 0 ? tableVariantsRef.current : rowsRef.current
    if (currentRows.length === 0) {
      return
    }

    const variants = resolveVariantStocksFromDraft(currentRows, next)
    tableVariantsRef.current = variants
    applyFormPatch({
      variants,
      stock: getVariantTotalStock(variants),
    })
  }

  function setOptionGroups(nextGroups: AdminProductOptionGroup[]) {
    const uniqueGroups = ensureUniqueOptionGroupIds(nextGroups)
    groupsRef.current = uniqueGroups
    setGroups(uniqueGroups)

    const stockByOptionKey: Record<string, number> = {}
    for (const row of tableVariantsRef.current) {
      const key = getVariantOptionKey(row.options ?? {})
      if (!key) {
        continue
      }
      stockByOptionKey[key] = resolveVariantStockFromDraft(row, stockInputsRef.current)
    }

    const nextVariants = buildVariantsFromOptionGroups(uniqueGroups, rowsRef.current).map((row) => {
      const key = getVariantOptionKey(row.options ?? {})
      if (key in stockByOptionKey) {
        return { ...row, stock: stockByOptionKey[key]! }
      }
      return row
    })
    const nextDraft = buildStockDraft(nextVariants)

    if (import.meta.env.DEV) {
      console.log(
        'optionGroups:',
        uniqueGroups.map((group) => ({ name: group.name, valuesInput: group.valuesInput })),
      )
      console.log(
        'generated variants:',
        nextVariants.map((variant) => ({ options: variant.options, stock: variant.stock })),
      )
    }

    tableVariantsRef.current = nextVariants
    applyFormPatch({
      optionGroups: uniqueGroups,
      variants: nextVariants,
      stock: getVariantTotalStock(nextVariants),
    })
    setStockInputs(nextDraft)
    stockInputsRef.current = nextDraft
    onVariantStockDraftChange?.(nextDraft)
  }

  function updateGroup(id: string, patch: Partial<AdminProductOptionGroup>) {
    // Patch exactly one group by id — never by index, never across groups.
    let matched = false
    const nextGroups = groupsRef.current.map((group) => {
      if (group.id !== id || matched) {
        return group
      }
      matched = true
      return {
        id: group.id,
        name: patch.name !== undefined ? patch.name : group.name,
        valuesInput: patch.valuesInput !== undefined ? patch.valuesInput : group.valuesInput,
      }
    })
    setOptionGroups(nextGroups)
  }

  function addGroup() {
    if (groupsRef.current.length === 0) {
      setOptionGroups(createInitialOptionGroups())
      return
    }
    setOptionGroups([...groupsRef.current, createBlankOptionGroup(groupsRef.current.length)])
  }

  function removeGroup(id: string) {
    setOptionGroups(groupsRef.current.filter((group) => group.id !== id))
  }

  function handleStockInputChange(id: string, value: string) {
    publishStockDraft({ ...stockInputsRef.current, [id]: value })
  }

  function applyBulkStock() {
    const stock = parseAdminNumericInput(bulkStockInput)
    publishStockDraft(
      Object.fromEntries(tableVariants.map((row) => [row.id, formatAdminNumericInput(stock)])),
    )
  }

  const showStockTable = tableVariants.length > 0

  return (
    <div className={`${adminSectionClassName} space-y-5`} data-testid="product-options-section">
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
                    data-testid={`option-name-${group.id}`}
                  />
                </div>
                <div>
                  <label className={adminLabelClassName}>옵션값</label>
                  <input
                    value={group.valuesInput}
                    onChange={(event) => updateGroup(group.id, { valuesInput: event.target.value })}
                    className={adminInputClassName}
                    placeholder={index === 0 ? '네이비, 화이트, 블랙' : '95, 100, 105'}
                    data-testid={`option-values-${group.id}`}
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

      {groups.length > 0 && !showStockTable && (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          색상·사이즈 옵션값을 입력하면 아래에 조합별 재고 입력표가 표시됩니다.
        </p>
      )}

      {showStockTable && (
        <div className="space-y-4" data-testid="option-stock-table">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className={adminLabelClassName}>총 재고</p>
            <p className="text-lg font-bold text-neutral-900" aria-live="polite">
              {displayedTotalStock}개
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              옵션 조합 {tableVariants.length}개 · 재고 합산 (자동 계산)
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200">
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
