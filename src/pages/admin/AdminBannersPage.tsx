import { useCallback, useEffect, useState } from 'react'
import { AdminBannerFormModal, AdminBannersList } from '../../components/admin/banners'
import { useAdminToast } from '../../components/admin/AdminToast'
import {
  AdminBannerRepositoryError,
  createAdminBanner,
  deleteAdminBanner,
  fetchAdminBanners,
  setAdminBannerActive,
  updateAdminBanner,
  updateAdminBannerSortOrders,
} from '../../services/adminBannerRepository'
import {
  BannerImageUploadError,
  deleteBannerImageByUrl,
  uploadBannerImage,
} from '../../services/adminBannerImageUploadService'
import type { AdminBannerFormInput, BannerRow } from '../../types/banner'

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminBannerRepositoryError || error instanceof BannerImageUploadError) {
    return error.message
  }

  return '배너 작업을 처리하지 못했습니다.'
}

export function AdminBannersPage() {
  const { showToast } = useAdminToast()
  const [banners, setBanners] = useState<BannerRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingBanner, setEditingBanner] = useState<BannerRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const loadBanners = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const rows = await fetchAdminBanners()
      setBanners(rows)
    } catch (error) {
      setBanners([])
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBanners()
  }, [loadBanners])

  function openCreateForm() {
    setEditingBanner(null)
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(banner: BannerRow) {
    setEditingBanner(banner)
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) {
      return
    }

    setIsFormOpen(false)
    setEditingBanner(null)
    setFormError(null)
  }

  async function uploadPendingImages(
    bannerId: string,
    input: AdminBannerFormInput,
    pendingFiles: { desktop?: File; mobile?: File },
  ): Promise<AdminBannerFormInput> {
    let nextInput = { ...input }

    if (pendingFiles.desktop) {
      const url = await uploadBannerImage(bannerId, pendingFiles.desktop, 'desktop')
      if (editingBanner?.desktop_image && editingBanner.desktop_image !== url) {
        await deleteBannerImageByUrl(editingBanner.desktop_image)
      }
      nextInput = { ...nextInput, desktop_image: url }
    }

    if (pendingFiles.mobile) {
      const url = await uploadBannerImage(bannerId, pendingFiles.mobile, 'mobile')
      if (editingBanner?.mobile_image && editingBanner.mobile_image !== url) {
        await deleteBannerImageByUrl(editingBanner.mobile_image)
      }
      nextInput = { ...nextInput, mobile_image: url }
    }

    return nextInput
  }

  async function handleSubmit(
    input: AdminBannerFormInput,
    pendingFiles: { desktop?: File; mobile?: File },
  ) {
    setIsSaving(true)
    setFormError(null)

    try {
      if (editingBanner) {
        const withImages = await uploadPendingImages(editingBanner.id, input, pendingFiles)
        await updateAdminBanner(editingBanner.id, withImages)
        showToast('배너가 수정되었습니다.')
      } else {
        const sortOrder = banners.length + 1
        const created = await createAdminBanner(input, sortOrder)
        const withImages = await uploadPendingImages(created.id, input, pendingFiles)

        if (
          withImages.desktop_image !== input.desktop_image ||
          withImages.mobile_image !== input.mobile_image
        ) {
          await updateAdminBanner(created.id, withImages)
        }

        showToast('배너가 등록되었습니다.')
      }

      closeForm()
      await loadBanners()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(bannerId: string) {
    const target = banners.find((banner) => banner.id === bannerId)
    if (!target) {
      return
    }

    const confirmed = window.confirm(`"${target.title}" 배너를 삭제할까요?`)
    if (!confirmed) {
      return
    }

    setActionId(bannerId)

    try {
      await deleteAdminBanner(bannerId)
      if (target.desktop_image) {
        await deleteBannerImageByUrl(target.desktop_image)
      }
      if (target.mobile_image) {
        await deleteBannerImageByUrl(target.mobile_image)
      }
      showToast('배너가 삭제되었습니다.')
      await loadBanners()
    } catch (error) {
      showToast(getErrorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  async function handleToggleActive(bannerId: string, isActive: boolean) {
    setActionId(bannerId)

    try {
      await setAdminBannerActive(bannerId, isActive)
      showToast(isActive ? '배너가 활성화되었습니다.' : '배너가 비활성화되었습니다.')
      await loadBanners()
    } catch (error) {
      showToast(getErrorMessage(error))
    } finally {
      setActionId(null)
    }
  }

  async function handleReorder(orderedIds: string[]) {
    const previous = banners
    const next = orderedIds
      .map((id) => banners.find((banner) => banner.id === id))
      .filter((banner): banner is BannerRow => Boolean(banner))
      .map((banner, index) => ({ ...banner, sort_order: index + 1 }))

    setBanners(next)

    try {
      await updateAdminBannerSortOrders(orderedIds)
      showToast('배너 순서가 저장되었습니다.')
    } catch (error) {
      setBanners(previous)
      showToast(getErrorMessage(error))
    }
  }

  const activeCount = banners.filter((banner) => banner.is_active).length

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">배너관리</h1>
          <p className="mt-2 text-base text-neutral-600 sm:text-lg">
            메인 페이지 히어로 배너를 등록하고 순서·노출을 관리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          배너 추가
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">전체 배너</p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">{banners.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">활성 배너</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">비활성 배너</p>
          <p className="mt-1 text-2xl font-bold text-neutral-700">{banners.length - activeCount}</p>
        </div>
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
            배너 목록을 불러오는 중입니다...
          </div>
        )}

        {!isLoading && errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700"
          >
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadBanners()}
              className="mt-4 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && banners.length === 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
            등록된 배너가 없습니다. 배너를 추가하면 메인 페이지에 표시됩니다.
          </div>
        )}

        {!isLoading && !errorMessage && banners.length > 0 && (
          <AdminBannersList
            banners={banners}
            actionId={actionId}
            onEdit={openEditForm}
            onDelete={(id) => void handleDelete(id)}
            onToggleActive={(id, isActive) => void handleToggleActive(id, isActive)}
            onReorder={(ids) => void handleReorder(ids)}
          />
        )}
      </div>

      <AdminBannerFormModal
        open={isFormOpen}
        banner={editingBanner}
        isSaving={isSaving}
        errorMessage={formError}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
