import { useEffect, useState } from 'react'
import { useAdminToast } from '../../components/admin/AdminToast'
import {
  DEFAULT_STORE_POLICY,
  loadStorePolicy,
  saveStorePolicy,
  type StorePolicy,
} from '../../lib/storePolicy'
import {
  adminInputClassName,
  adminLabelClassName,
  adminTextareaClassName,
} from '../../components/admin/products/detail/adminFormStyles'

export function AdminSettingsPage() {
  const [policy, setPolicy] = useState<StorePolicy>(DEFAULT_STORE_POLICY)
  const { showToast } = useAdminToast()

  useEffect(() => {
    setPolicy(loadStorePolicy())
  }, [])

  function updateShipping(key: keyof StorePolicy['shipping'], value: string) {
    setPolicy((current) => ({
      ...current,
      shipping: { ...current.shipping, [key]: value },
    }))
  }

  function updateReturns(key: keyof StorePolicy['returns'], value: string) {
    setPolicy((current) => ({
      ...current,
      returns: { ...current.returns, [key]: value },
    }))
  }

  function handleSave() {
    saveStorePolicy(policy)
    showToast('저장되었습니다. 모든 상품에 적용됩니다.')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">설정</h1>
        <p className="mt-2 text-sm text-neutral-500">
          배송·교환 정책은 모든 상품에 공통으로 적용됩니다.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-lg font-bold text-neutral-900">배송 정책</h2>
        <div>
          <label htmlFor="policy-shipping-fee" className={adminLabelClassName}>
            배송비
          </label>
          <input
            id="policy-shipping-fee"
            value={policy.shipping.shipping_fee}
            onChange={(event) => updateShipping('shipping_fee', event.target.value)}
            className={adminInputClassName}
          />
        </div>
        <div>
          <label htmlFor="policy-delivery" className={adminLabelClassName}>
            배송기간
          </label>
          <textarea
            id="policy-delivery"
            value={policy.shipping.delivery_period}
            onChange={(event) => updateShipping('delivery_period', event.target.value)}
            rows={3}
            className={`${adminTextareaClassName} resize-y`}
          />
        </div>
        <div>
          <label htmlFor="policy-free-shipping" className={adminLabelClassName}>
            무료배송 안내
          </label>
          <input
            id="policy-free-shipping"
            value={policy.shipping.free_shipping_threshold}
            onChange={(event) => updateShipping('free_shipping_threshold', event.target.value)}
            className={adminInputClassName}
          />
        </div>
        <div>
          <label htmlFor="policy-shipping-notes" className={adminLabelClassName}>
            추가 안내
          </label>
          <textarea
            id="policy-shipping-notes"
            value={policy.shipping.additional_notes}
            onChange={(event) => updateShipping('additional_notes', event.target.value)}
            rows={4}
            className={`${adminTextareaClassName} resize-y`}
          />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-bold text-neutral-900">교환·반품 정책</h2>
        <div>
          <label htmlFor="policy-exchange" className={adminLabelClassName}>
            신청 기간
          </label>
          <input
            id="policy-exchange"
            value={policy.returns.exchange_period}
            onChange={(event) => updateReturns('exchange_period', event.target.value)}
            className={adminInputClassName}
          />
        </div>
        <div>
          <label htmlFor="policy-return-address" className={adminLabelClassName}>
            반품 주소
          </label>
          <input
            id="policy-return-address"
            value={policy.returns.return_address}
            onChange={(event) => updateReturns('return_address', event.target.value)}
            className={adminInputClassName}
          />
        </div>
        <div>
          <label htmlFor="policy-eligible" className={adminLabelClassName}>
            교환·반품이 가능한 경우
          </label>
          <textarea
            id="policy-eligible"
            value={policy.returns.eligible_cases}
            onChange={(event) => updateReturns('eligible_cases', event.target.value)}
            rows={4}
            className={`${adminTextareaClassName} resize-y`}
          />
        </div>
        <div>
          <label htmlFor="policy-ineligible" className={adminLabelClassName}>
            교환·반품이 어려운 경우
          </label>
          <textarea
            id="policy-ineligible"
            value={policy.returns.ineligible_cases}
            onChange={(event) => updateReturns('ineligible_cases', event.target.value)}
            rows={4}
            className={`${adminTextareaClassName} resize-y`}
          />
        </div>
        <div>
          <label htmlFor="policy-return-shipping" className={adminLabelClassName}>
            배송비 안내
          </label>
          <textarea
            id="policy-return-shipping"
            value={policy.returns.shipping_fee_notes}
            onChange={(event) => updateReturns('shipping_fee_notes', event.target.value)}
            rows={3}
            className={`${adminTextareaClassName} resize-y`}
          />
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        className="h-12 rounded-2xl bg-neutral-900 px-6 text-sm font-bold text-white hover:bg-neutral-800"
      >
        저장
      </button>
    </div>
  )
}
