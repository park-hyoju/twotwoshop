import { useEffect, useState } from 'react'
import { ProductImageUploadZone } from '../products/detail/images/ProductImageUploadZone'
import {
  adminInputClassName,
  adminLabelClassName,
} from '../products/detail/adminFormStyles'
import {
  DEFAULT_HERO_BUTTON_LINK,
  DEFAULT_HERO_BUTTON_TEXT,
  DEFAULT_HERO_DESCRIPTION,
  DEFAULT_HERO_EYEBROW,
  DEFAULT_HERO_HEADLINE,
} from '../../../data/heroBannerSlides'
import { formatBannerImageSizeGuide } from '../../../lib/bannerConstants'
import { ROUTES } from '../../../lib/routes'
import type { AdminBannerFormInput, BannerRow } from '../../../types/banner'
import { validateAdminBannerInput } from '../../../utils/validators'
import { BannerStorefrontPreview } from './BannerStorefrontPreview'

const EMPTY_FORM: AdminBannerFormInput = {
  eyebrow: DEFAULT_HERO_EYEBROW,
  headline: DEFAULT_HERO_HEADLINE,
  description: DEFAULT_HERO_DESCRIPTION,
  button_text: DEFAULT_HERO_BUTTON_TEXT,
  button_link: DEFAULT_HERO_BUTTON_LINK,
  desktop_image: '',
  mobile_image: '',
  is_active: true,
}

const LINK_SUGGESTIONS = [
  { label: '신상품', href: ROUTES.productsNew },
  { label: '인기상품', href: ROUTES.productsBest },
  { label: '특가상품', href: ROUTES.productsSale },
  { label: '전체 상품', href: ROUTES.products },
]

interface AdminBannerFormModalProps {
  open: boolean
  banner: BannerRow | null
  isSaving: boolean
  errorMessage: string | null
  onClose: () => void
  onSubmit: (
    input: AdminBannerFormInput,
    pendingFiles: { desktop?: File; mobile?: File },
  ) => Promise<void>
}

export function AdminBannerFormModal({
  open,
  banner,
  isSaving,
  errorMessage,
  onClose,
  onSubmit,
}: AdminBannerFormModalProps) {
  const [form, setForm] = useState<AdminBannerFormInput>(EMPTY_FORM)
  const [pendingDesktopFile, setPendingDesktopFile] = useState<File | undefined>()
  const [pendingMobileFile, setPendingMobileFile] = useState<File | undefined>()
  const [localPreviewDesktop, setLocalPreviewDesktop] = useState<string | null>(null)
  const [localPreviewMobile, setLocalPreviewMobile] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [headlineError, setHeadlineError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    if (banner) {
      setForm({
        eyebrow: banner.eyebrow ?? DEFAULT_HERO_EYEBROW,
        headline: banner.headline ?? banner.title,
        description: banner.description,
        button_text: banner.button_text,
        button_link: banner.button_link,
        desktop_image: banner.desktop_image ?? '',
        mobile_image: banner.mobile_image ?? '',
        is_active: banner.is_active,
      })
    } else {
      setForm(EMPTY_FORM)
    }

    setPendingDesktopFile(undefined)
    setPendingMobileFile(undefined)
    setLocalPreviewDesktop(null)
    setLocalPreviewMobile(null)
    setShowPreview(false)
    setHeadlineError(null)
  }, [open, banner])

  useEffect(() => {
    if (!pendingDesktopFile) {
      setLocalPreviewDesktop(null)
      return
    }

    const url = URL.createObjectURL(pendingDesktopFile)
    setLocalPreviewDesktop(url)

    return () => URL.revokeObjectURL(url)
  }, [pendingDesktopFile])

  useEffect(() => {
    if (!pendingMobileFile) {
      setLocalPreviewMobile(null)
      return
    }

    const url = URL.createObjectURL(pendingMobileFile)
    setLocalPreviewMobile(url)

    return () => URL.revokeObjectURL(url)
  }, [pendingMobileFile])

  if (!open) {
    return null
  }

  const previewForm: AdminBannerFormInput = {
    ...form,
    desktop_image: localPreviewDesktop ?? form.desktop_image,
    mobile_image: localPreviewMobile ?? form.mobile_image,
  }

  function updateField<K extends keyof AdminBannerFormInput>(
    field: K,
    value: AdminBannerFormInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const validationError = validateAdminBannerInput(form)
    if (validationError) {
      if (form.headline.trim().length === 0) {
        setHeadlineError('메인 제목을 입력해주세요.')
      }
      return
    }

    setHeadlineError(null)

    await onSubmit(form, {
      desktop: pendingDesktopFile,
      mobile: pendingMobileFile,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-form-title"
        className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
          <h2 id="banner-form-title" className="text-lg font-bold text-neutral-900 sm:text-xl">
            {banner ? '배너 수정' : '배너 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            닫기
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            {errorMessage && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <div>
              <label htmlFor="banner-eyebrow" className={adminLabelClassName}>
                작은 제목 (eyebrow)
              </label>
              <input
                id="banner-eyebrow"
                value={form.eyebrow}
                onChange={(event) => updateField('eyebrow', event.target.value)}
                className={adminInputClassName}
                placeholder="2026 SUMMER COLLECTION"
              />
            </div>

            <div>
              <label htmlFor="banner-headline" className={adminLabelClassName}>
                메인 제목 (headline)
              </label>
              <textarea
                id="banner-headline"
                value={form.headline}
                onChange={(event) => {
                  updateField('headline', event.target.value)
                  if (headlineError) {
                    setHeadlineError(null)
                  }
                }}
                rows={2}
                className={`${adminInputClassName} resize-y`}
                placeholder={'감각적인 데일리 룩,\nTWOTWOSHOP'}
                required
              />
              {headlineError ? (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {headlineError}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="banner-description" className={adminLabelClassName}>
                설명 (description)
              </label>
              <textarea
                id="banner-description"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                rows={3}
                className={`${adminInputClassName} resize-y`}
                placeholder="신규 회원 가입 시 5,000원 쿠폰 지급"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="banner-button-text" className={adminLabelClassName}>
                  버튼 텍스트
                </label>
                <input
                  id="banner-button-text"
                  value={form.button_text}
                  onChange={(event) => updateField('button_text', event.target.value)}
                  className={adminInputClassName}
                  placeholder="지금 쇼핑하기"
                />
              </div>

              <div>
                <label htmlFor="banner-button-link" className={adminLabelClassName}>
                  버튼 링크
                </label>
                <input
                  id="banner-button-link"
                  value={form.button_link}
                  onChange={(event) => updateField('button_link', event.target.value)}
                  className={adminInputClassName}
                  placeholder="/products/new"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {LINK_SUGGESTIONS.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => updateField('button_link', item.href)}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              <p className="font-semibold text-neutral-800">이미지 권장 사이즈</p>
              <ul className="mt-2 space-y-1">
                <li>{formatBannerImageSizeGuide('desktop')}</li>
                <li>{formatBannerImageSizeGuide('mobile')}</li>
              </ul>
              <p className="mt-2 text-xs text-neutral-500">
                이미지 없이도 저장할 수 있습니다. 등록 후 메인 Hero에 문구와 버튼이 표시됩니다.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ProductImageUploadZone
                title="PC 배너 이미지"
                description={formatBannerImageSizeGuide('desktop')}
                compact
                disabled={isSaving}
                previewUrl={(localPreviewDesktop ?? form.desktop_image) || undefined}
                onFilesSelected={(files) => setPendingDesktopFile(files[0])}
              />
              <ProductImageUploadZone
                title="모바일 배너 이미지"
                description={formatBannerImageSizeGuide('mobile')}
                compact
                disabled={isSaving}
                previewUrl={(localPreviewMobile ?? form.mobile_image) || undefined}
                onFilesSelected={(files) => setPendingMobileFile(files[0])}
              />
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={form.is_active}
                disabled={isSaving}
                onChange={(event) => updateField('is_active', event.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              활성화 (메인 페이지에 노출)
            </label>

            {showPreview && <BannerStorefrontPreview form={previewForm} />}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setShowPreview((current) => !current)}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              {showPreview ? '미리보기 닫기' : '미리보기'}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSaving || form.headline.trim().length === 0}
                className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
              >
                {isSaving ? '저장 중...' : banner ? '수정 저장' : '배너 등록'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
