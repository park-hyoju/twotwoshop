import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StorefrontToast } from '../../common/StorefrontToast'
import { useCustomerAuth } from '../../../contexts/CustomerAuthProvider'
import { getProductCategoryRoute } from '../../../constants/productCategories'
import { ROUTES } from '../../../lib/routes'
import {
  RestockNotificationRepositoryError,
  subscribeGuestRestockNotificationForProduct,
  subscribeMemberRestockNotification,
} from '../../../services/restockNotificationRepository'
import {
  RESTOCK_SUBSCRIBE_MESSAGES,
  type RestockNotificationStatus,
} from '../../../types/restockNotification'
import type { Product } from '../../../types/product'
import { RestockGuestModal } from './RestockGuestModal'

interface ProductSoldOutNoticeProps {
  product: Product
}

export function ProductSoldOutNotice({ product }: ProductSoldOutNoticeProps) {
  const { isMember, isLoading: isAuthLoading } = useCustomerAuth()
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [guestErrorMessage, setGuestErrorMessage] = useState<string | null>(null)
  const browsePath = getProductCategoryRoute(product.productCategory)

  function showResult(status: RestockNotificationStatus) {
    setToastMessage(RESTOCK_SUBSCRIBE_MESSAGES[status])
  }

  function getErrorMessage(error: unknown): string {
    if (error instanceof RestockNotificationRepositoryError) {
      return error.message
    }

    return '재입고 알림 신청에 실패했습니다.'
  }

  async function handleMemberSubscribe() {
    setIsSubmitting(true)

    try {
      const result = await subscribeMemberRestockNotification(product.id, product.slug)
      showResult(result.status)
    } catch (error) {
      setToastMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleRestockClick() {
    if (isAuthLoading) {
      return
    }

    if (isMember) {
      void handleMemberSubscribe()
      return
    }

    setGuestErrorMessage(null)
    setIsGuestModalOpen(true)
  }

  async function handleGuestSubmit(input: {
    customerName: string
    phone: string
    email: string
  }) {
    setIsSubmitting(true)
    setGuestErrorMessage(null)

    try {
      const result = await subscribeGuestRestockNotificationForProduct(product.id, product.slug, {
        customerName: input.customerName,
        phone: input.phone,
        email: input.email || undefined,
      })

      setIsGuestModalOpen(false)
      showResult(result.status)
    } catch (error) {
      setGuestErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-neutral-200/90 bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_100%)] p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)] sm:p-7">
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
          🖤 현재 품절된 상품입니다.
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-neutral-600 sm:text-base">
          인기가 많아 일시적으로 품절되었습니다.
          <br />
          재입고 시 가장 먼저 알려드릴게요.
        </p>

        {!isMember && !isAuthLoading && (
          <p className="mt-4 text-sm text-neutral-500">
            회원이시라면{' '}
            <Link to={ROUTES.signin} className="font-semibold text-neutral-800 underline-offset-2 hover:underline">
              로그인
            </Link>
            후 추가 입력 없이 신청할 수 있어요.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleRestockClick}
            disabled={isSubmitting || isAuthLoading}
            className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-neutral-900 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
          >
            {isSubmitting ? '신청 중...' : '재입고 알림 신청'}
          </button>
          <Link
            to={browsePath}
            className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-[15px] font-semibold text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 sm:text-base"
          >
            다른 상품 둘러보기
          </Link>
        </div>
      </div>

      <RestockGuestModal
        isOpen={isGuestModalOpen}
        isSubmitting={isSubmitting}
        errorMessage={guestErrorMessage}
        onClose={() => {
          if (!isSubmitting) {
            setIsGuestModalOpen(false)
            setGuestErrorMessage(null)
          }
        }}
        onSubmit={handleGuestSubmit}
      />

      {toastMessage && (
        <StorefrontToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </>
  )
}
