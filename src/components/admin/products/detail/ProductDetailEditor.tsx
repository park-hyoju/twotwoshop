import { useEffect, useState } from 'react'
import {
  AdminProductDetailRepositoryError,
  fetchAdminProductDetail,
  saveAdminProductDetail,
} from '../../../../services/adminProductDetailRepository'
import type { AdminProductDetailForm, ProductDetailEditorTab } from '../../../../types/adminProductDetail'
import { createEmptyProductDetailForm } from '../../../../lib/adminProductDetailDefaults'
import { AdminProductPreview } from './AdminProductPreview'
import { BasicInfoTab } from './BasicInfoTab'
import { DescriptionTab } from './DescriptionTab'
import { ImagesTab } from './ImagesTab'
import { ProductInfoTab } from './ProductInfoTab'
import { PRODUCT_DETAIL_TABS } from './productDetailTabs'
import { SeoTab } from './SeoTab'
import { ShippingTab } from './ShippingTab'
import { SizeGuideTab } from './SizeGuideTab'

interface ProductDetailEditorProps {
  productId: string
  onClose: () => void
  onSaved: (message: string) => void
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminProductDetailRepositoryError) {
    return error.message
  }

  return '상품 상세를 처리하는 중 오류가 발생했습니다.'
}

export function ProductDetailEditor({ productId, onClose, onSaved }: ProductDetailEditorProps) {
  const [activeTab, setActiveTab] = useState<ProductDetailEditorTab>('basic')
  const [form, setForm] = useState<AdminProductDetailForm>(() =>
    createEmptyProductDetailForm(productId),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDetail() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const detail = await fetchAdminProductDetail(productId)
        if (!cancelled) {
          setForm(detail)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      cancelled = true
    }
  }, [productId])

  function updateForm<K extends keyof AdminProductDetailForm>(
    field: K,
    value: AdminProductDetailForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    setSaveError(null)
    setSaveSuccessMessage(null)
    setIsSaving(true)

    try {
      const savedForm = await saveAdminProductDetail(form)
      setForm(savedForm)
      const message = '저장되었습니다.'
      setSaveSuccessMessage(message)
      onSaved(message)
    } catch (error) {
      setSaveError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  function renderTabContent() {
    if (activeTab === 'preview') {
      return <AdminProductPreview form={form} />
    }

    const tabProps = { form, onChange: updateForm }

    switch (activeTab) {
      case 'basic':
        return <BasicInfoTab {...tabProps} />
      case 'images':
        return <ImagesTab {...tabProps} />
      case 'description':
        return <DescriptionTab {...tabProps} />
      case 'size':
        return <SizeGuideTab {...tabProps} />
      case 'info':
        return <ProductInfoTab {...tabProps} />
      case 'shipping':
        return <ShippingTab {...tabProps} />
      case 'seo':
        return <SeoTab {...tabProps} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">상품 상세 관리</p>
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
              {form.name || '상품 상세 수정'}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isLoading || isSaving || Boolean(loadError)}
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-neutral-200 bg-white px-4 sm:px-6">
        <div className="flex gap-2 overflow-x-auto py-3">
          {PRODUCT_DETAIL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {isLoading && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-base text-neutral-600">상품 상세를 불러오는 중입니다...</p>
          </div>
        )}

        {!isLoading && loadError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center"
          >
            <p className="text-base font-medium text-red-700">{loadError}</p>
          </div>
        )}

        {!isLoading && !loadError && (
          <>
            {saveSuccessMessage && (
              <p
                role="status"
                className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
              >
                {saveSuccessMessage}
              </p>
            )}
            {saveError && (
              <p
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {saveError}
              </p>
            )}
            {renderTabContent()}
          </>
        )}
      </main>
    </div>
  )
}
