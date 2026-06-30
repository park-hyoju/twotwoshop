import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { CheckoutAddressPicker, CheckoutForm, CheckoutOrderSummary } from '../../components/checkout'
import { useCustomerAuth } from '../../contexts/CustomerAuthProvider'
import { useCart } from '../../hooks/useCart'
import { isCartItemAvailable } from '../../lib/cartItem'
import {
  isCheckoutFormReady,
  isSameAddressForm,
  mapAddressToCheckoutForm,
  mapCheckoutFormToAddressInput,
} from '../../lib/checkoutAddress'
import { calculateOrderTotal, calculateShippingFee } from '../../lib/orderConstants'
import { INSUFFICIENT_STOCK_ORDER_MESSAGE } from '../../lib/productStock'
import { ROUTES } from '../../lib/routes'
import {
  fetchMemberCoupons,
  findSelectedCoupon,
  getApplicableCoupons,
} from '../../services/couponRepository'
import {
  fetchCustomerAddresses,
  saveCheckoutAddressAsDefault,
} from '../../services/customerAddressRepository'
import { OrderCouponError, OrderSaveError, OrderStockError, orderRepository } from '../../services/orderRepository'
import { canSubmitOrder, createOrder } from '../../store/orderStore'
import {
  hasCheckoutFormErrors,
  sanitizeCheckoutForm,
  validateCheckoutForm,
} from '../../utils/validators'
import { INITIAL_CHECKOUT_FORM, type CheckoutFormData, type CheckoutFormErrors } from '../../types/order'
import type { CustomerAddress } from '../../types/mypage'
import type { MemberCoupon } from '../../types/coupon'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { isMember, isLoading: isAuthLoading, profile, user } = useCustomerAuth()
  const { items, syncCart, clearCart, getCartTotal, hasSoldOutItems, isCartSyncing } = useCart()
  const [form, setForm] = useState<CheckoutFormData>(INITIAL_CHECKOUT_FORM)
  const [fieldErrors, setFieldErrors] = useState<CheckoutFormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [memberAddresses, setMemberAddresses] = useState<CustomerAddress[]>([])
  const [coupons, setCoupons] = useState<MemberCoupon[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [loadedDefaultAddress, setLoadedDefaultAddress] = useState(false)
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [isAddressPickerOpen, setIsAddressPickerOpen] = useState(false)
  const isSubmittingRef = useRef(false)
  const hasInitializedMemberRef = useRef(false)

  useEffect(() => {
    void syncCart()
  }, [syncCart])

  useEffect(() => {
    if (isAuthLoading || !isMember || hasInitializedMemberRef.current) {
      return
    }

    hasInitializedMemberRef.current = true
    let cancelled = false

    async function loadMemberData() {
      try {
        const [addresses, memberCoupons] = await Promise.all([
          fetchCustomerAddresses(),
          fetchMemberCoupons().catch(() => []),
        ])

        if (cancelled) return

        setMemberAddresses(addresses)
        setCoupons(memberCoupons)

        setForm((prev) => ({
          ...prev,
          customerName: profile?.name?.trim() || prev.customerName,
          customerPhone: profile?.phone?.trim() || prev.customerPhone,
          customerEmail: profile?.email?.trim() || user?.email?.trim() || prev.customerEmail,
        }))

        const defaultAddress = addresses
          .filter((address) => address.isDefault)
          .sort(
            (left, right) =>
              new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
          )[0]

        if (defaultAddress) {
          setForm((prev) => mapAddressToCheckoutForm(defaultAddress, prev))
          setSelectedAddressId(defaultAddress.id)
          setLoadedDefaultAddress(true)
        }
      } catch (error) {
        console.warn('[CheckoutPage] failed to load member data', error)
      }
    }

    void loadMemberData()

    return () => {
      cancelled = true
    }
  }, [isAuthLoading, isMember, profile, user?.email])

  const orderableItems = useMemo(
    () => items.filter(isCartItemAvailable),
    [items],
  )

  const productTotal = getCartTotal()
  const selectedCoupon = findSelectedCoupon(coupons, form.selectedCouponId)
  const couponDiscount = selectedCoupon?.discountAmount ?? 0
  const shippingFee = calculateShippingFee(productTotal)
  const totalAmount = calculateOrderTotal(productTotal, couponDiscount)
  const applicableCoupons = getApplicableCoupons(coupons, productTotal)
  const soldOutIncluded = hasSoldOutItems()
  const canSubmit =
    isCheckoutFormReady(form) &&
    !hasCheckoutFormErrors(validateCheckoutForm(form)) &&
    canSubmitOrder(orderableItems, soldOutIncluded) &&
    productTotal > 0

  if (isCartSyncing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-lg text-neutral-600">주문 정보를 불러오는 중입니다...</p>
      </div>
    )
  }

  if (orderableItems.length === 0 && !isSubmittingRef.current) {
    return <Navigate to={ROUTES.cart} replace />
  }

  function handleChange<K extends keyof CheckoutFormData>(
    field: K,
    value: CheckoutFormData[K],
  ) {
    setForm((prev) => {
      const nextForm = { ...prev, [field]: value }

      if (selectedAddressId) {
        const selected = memberAddresses.find((address) => address.id === selectedAddressId)
        if (selected && !isSameAddressForm(selected, nextForm)) {
          setSelectedAddressId(null)
        }
      }

      return nextForm
    })
    setLoadedDefaultAddress(false)
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
    if (submitError) setSubmitError('')
  }

  function handleSelectAddress(address: CustomerAddress) {
    setForm((prev) => mapAddressToCheckoutForm(address, prev))
    setSelectedAddressId(address.id)
    setLoadedDefaultAddress(address.isDefault)
    setIsAddressPickerOpen(false)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    const sanitizedForm = sanitizeCheckoutForm(form)
    const errors = validateCheckoutForm(sanitizedForm)

    if (hasCheckoutFormErrors(errors)) {
      setFieldErrors(errors)
      return
    }

    if (!canSubmitOrder(orderableItems, soldOutIncluded)) {
      setSubmitError('주문할 수 있는 상품이 없습니다. 장바구니를 확인해주세요.')
      return
    }

    const order = createOrder(orderableItems, sanitizedForm, {
      selectedCoupon,
      isMember,
    })

    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      await orderRepository.saveOrder(order)

      if (isMember && saveAsDefault) {
        try {
          await saveCheckoutAddressAsDefault(
            mapCheckoutFormToAddressInput(sanitizedForm, true),
            selectedAddressId,
          )
        } catch (error) {
          console.warn('[CheckoutPage] failed to save checkout address as default', error)
        }
      }

      navigate(ROUTES.orderComplete, { state: { order, isMember } })
      clearCart()
    } catch (error) {
      isSubmittingRef.current = false
      setIsSubmitting(false)

      if (error instanceof OrderStockError) {
        setSubmitError(INSUFFICIENT_STOCK_ORDER_MESSAGE)
        void syncCart()
        return
      }

      if (error instanceof OrderCouponError) {
        setSubmitError(error.message)
        return
      }

      if (error instanceof OrderSaveError) {
        setSubmitError(error.message)
        return
      }

      setSubmitError('주문 접수에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-6">
        <Link to={ROUTES.cart} className="text-base text-neutral-600 hover:text-neutral-900">
          ← 장바구니로
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">주문서 작성</h1>
      <p className="mt-4 text-lg text-neutral-600">
        주문 정보를 확인하고 무통장 입금 주문을 완료해주세요.
      </p>

      {soldOutIncluded ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">
          품절 상품이 포함되어 있습니다. 품절 상품을 삭제한 후 주문해주세요.
        </p>
      ) : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <CheckoutForm
          form={form}
          fieldErrors={fieldErrors}
          submitError={submitError}
          isSubmitting={isSubmitting}
          isMember={isMember}
          loadedDefaultAddress={loadedDefaultAddress}
          saveAsDefault={saveAsDefault}
          onSaveAsDefaultChange={setSaveAsDefault}
          onOpenAddressPicker={() => setIsAddressPickerOpen(true)}
          hasSavedAddresses={memberAddresses.length > 0}
          coupons={coupons}
          applicableCoupons={applicableCoupons}
          productTotal={productTotal}
          couponDiscount={couponDiscount}
          shippingFee={shippingFee}
          totalAmount={totalAmount}
          canSubmit={canSubmit}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />

        <CheckoutOrderSummary
          items={items}
          productTotal={productTotal}
          couponDiscount={couponDiscount}
          shippingFee={shippingFee}
          totalAmount={totalAmount}
        />
      </div>

      {isAddressPickerOpen ? (
        <CheckoutAddressPicker
          addresses={memberAddresses}
          selectedAddressId={selectedAddressId}
          onSelect={handleSelectAddress}
          onClose={() => setIsAddressPickerOpen(false)}
        />
      ) : null}
    </div>
  )
}
