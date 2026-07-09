import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildVariantsFromOptionGroups,
  formatVariantOptionLabel,
  getDisplayedVariantTotalStock,
  getVariantOptionKey,
  getVariantTotalStock,
  normalizeOptionGroupsInput,
  optionGroupsNeedNormalization,
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
  onVariantStockDraftChange?: (draft: Record<string, string>) => void
}

const OPTION_SYNC_DEBOUNCE_MS = 350

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

function stockByVariantIdFromDraft(
  rows: AdminProductVariant[],
  stockInputs: Record<string, string>,
): Record<string, number> {
  return Object.fromEntries(
    resolveVariantStocksFromDraft(rows, stockInputs).map((row) => [row.id, row.stock]),
  )
}

export function ProductOptionsSection({
  form,
  onChange,
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

  const [stockInputs, setStockInputs] = useState<Record<string, string>>(() => buildStockDraft(rows))
  const [bulkStockInput, setBulkStockInput] = useState('')
  const rowsRef = useRef(rows)
  const stockInputsRef = useRef(stockInputs)

  rowsRef.current = rows
  stockInputsRef.current = stockInputs

  useEffect(() => {
    const nextStock = buildStockDraft(form.variants)
    setStockInputs(nextStock)
    onVariantStockDraftChange?.(nextStock)
  }, [form.id, onVariantStockDraftChange])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (groups.length === 0) {
        if (rowsRef.current.length > 0) {
          onChange('variants', [])
          onChange('stock', 0)
          const nextDraft = {}
          setStockInputs(nextDraft)
          onVariantStockDraftChange?.(nextDraft)
        }
        return
      }

      if (optionGroupsNeedNormalization(groups)) {
        onChange('optionGroups', normalizeOptionGroupsInput(groups))
        return
      }

      const nextVariants = buildVariantsFromOptionGroups(
        groups,
        rowsRef.current,
        stockByVariantIdFromDraft(rowsRef.current, stockInputsRef.current),
      )
      const currentKeys = rowsRef.current
        .map((row) => getVariantOptionKey(row.options))
        .join(',')
      const nextKeys = nextVariants.map((row) => getVariantOptionKey(row.options)).join(',')

      if (currentKeys === nextKeys) {
        return
      }

      onChange('variants', nextVariants)
      onChange('stock', getVariantTotalStock(nextVariants))
      const nextDraft = buildStockDraft(nextVariants)
      setStockInputs(nextDraft)
      onVariantStockDraftChange?.(nextDraft)
    }, OPTION_SYNC_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [groups, groupsSignature, form.id, onChange, onVariantStockDraftChange])

  const displayedTotalStock = useMemo(
    () => getDisplayedVariantTotalStock(rows, stockInputs),
    [rows, stockInputs],
  )

  function publishStockDraft(next: Record<string, string>) {
    setStockInputs(next)
    onVariantStockDraftChange?.(next)
  }

  function setOptionGroups(nextGroups: AdminProductOptionGroup[]) {
    onChange('optionGroups', nextGroups)
  }

  function updateGroup(id: string, patch: Partial<AdminProductOptionGroup>) {
    setOptionGroups(groups.map((group) => (group.id === id ? { ...group, ...patch } : group)))
  }

  function addGroup() {
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
      Object.fromEntries(rows.map((row) => [row.id, formatAdminNumericInput(stock)])),
    )
  }

  const hasGeneratedVariants = rows.length > 0

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
          <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            옵션명에는 <strong className="font-semibold text-neutral-800">색상</strong>,{' '}
            <strong className="font-semibold text-neutral-800">사이즈</strong>처럼 종류만 입력하고,
            네이비·화이트·95·100 같은 실제 선택지는 옵션값에 입력하세요.
          </p>
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

      {hasGeneratedVariants && (
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
                {rows.map((row) => (
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

export function applyVariantStockDraftToForm(
  form: AdminProductDetailForm,
  draft: Record<string, string>,
): AdminProductDetailForm {
  const variants = resolveVariantStocksFromDraft(form.variants, draft)

  return {
    ...form,
    variants,
    stock: form.variants.length > 0 ? getVariantTotalStock(variants) : form.stock,
  }
}
