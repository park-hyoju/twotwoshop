import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { CheckoutForm, CheckoutOrderSummary } from '../../components/checkout'
import { useCart } from '../../hooks/useCart'
import { isCartItemAvailable } from '../../lib/cartItem'
import { SHIPPING_FEE } from '../../lib/orderConstants'
import { orderRepository } from '../../services/orderRepository'
import { ROUTES } from '../../lib/routes'
import {
  canSubmitOrder,
  createOrder,
  hasCheckoutFormErrors,
  validateCheckoutForm,
} from '../../store/orderStore'
import type { CheckoutFormData, CheckoutFormErrors } from '../../types/order'

const initialForm: CheckoutFormData = {
  customerName: '',
  phone: '',
  postalCode: '',
  address: '',
  addressDetail: '',
  memo: '',
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, syncCart, clearCart, getCartTotal, hasSoldOutItems } = useCart()
  const [form, setForm] = useState<CheckoutFormData>(initialForm)
  const [fieldErrors, setFieldErrors] = useState<CheckoutFormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    syncCart()
  }, [syncCart])

  const orderableItems = useMemo(
    () => items.filter(isCartItemAvailable),
    [items],
  )

  const productTotal = getCartTotal()
  const totalAmount = productTotal + SHIPPING_FEE
  const soldOutIncluded = hasSoldOutItems()

  if (orderableItems.length === 0 && !isSubmittingRef.current) {
    return <Navigate to={ROUTES.cart} replace />
  }

  const handleChange = (field: keyof CheckoutFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev
      }

      const next = { ...prev }
      delete next[field]
      return next
    })
    if (submitError) {
      setSubmitError('')
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) {
      return
    }

    const errors = validateCheckoutForm(form)

    if (hasCheckoutFormErrors(errors)) {
      setFieldErrors(errors)
      return
    }

    if (!canSubmitOrder(orderableItems, soldOutIncluded)) {
      setSubmitError('주문할 수 있는 상품이 없습니다. 장바구니를 확인해주세요.')
      return
    }

    if (productTotal <= 0) {
      setSubmitError('총 결제 금액을 계산할 수 없습니다. 장바구니를 확인해주세요.')
      return
    }

    const order = createOrder(orderableItems, form)
    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      await orderRepository.saveOrder(order)
      navigate(ROUTES.orderComplete, { state: { order } })
      clearCart()
    } catch {
      isSubmittingRef.current = false
      setIsSubmitting(false)
      setSubmitError('주문 접수 중 문제가 발생했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-6">
        <Link
          to={ROUTES.cart}
          className="text-base text-neutral-600 transition-colors hover:text-neutral-900 sm:text-lg"
        >
          ← 장바구니로
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">주문서 작성</h1>
      <p className="mt-4 text-lg text-neutral-600 sm:text-xl">
        배송 정보를 입력하고 주문을 접수해주세요.
      </p>

      {soldOutIncluded && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700 sm:text-lg">
          품절 상품이 포함되어 있습니다. 품절 상품을 삭제한 후 주문해주세요.
        </p>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <CheckoutForm
          form={form}
          fieldErrors={fieldErrors}
          submitError={submitError}
          isSubmitting={isSubmitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />

        <CheckoutOrderSummary
          items={items}
          productTotal={productTotal}
          shippingFee={SHIPPING_FEE}
          totalAmount={totalAmount}
        />
      </div>
    </div>
  )
}
