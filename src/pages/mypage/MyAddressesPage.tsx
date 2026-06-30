import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { MapPin, Pencil, Star, Trash2 } from 'lucide-react'
import { MyPageEmptyState } from '../../components/mypage/MyPageEmptyState'
import { MyPageShell } from '../../components/mypage/MyPageShell'
import { AddressSearchFields } from '../../components/address/AddressSearchFields'
import {
  createCustomerAddress,
  CustomerAddressRepositoryError,
  deleteCustomerAddress,
  fetchCustomerAddresses,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from '../../services/customerAddressRepository'
import {
  getFirstFieldError,
  validateCustomerAddressInput,
} from '../../utils/validators'
import { runGuardedSubmit } from '../../utils/submitGuard'
import type { CustomerAddress, CustomerAddressInput } from '../../types/mypage'

const EMPTY_FORM: CustomerAddressInput = {
  label: '집',
  recipientName: '',
  phone: '',
  zipcode: '',
  address1: '',
  address2: '',
  isDefault: false,
}

export function MyAddressesPage() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CustomerAddressInput>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadAddresses = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const nextAddresses = await fetchCustomerAddresses()
      setAddresses(nextAddresses)
    } catch (error) {
      setErrorMessage(
        error instanceof CustomerAddressRepositoryError
          ? error.message
          : '배송지 목록을 불러오지 못했습니다.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAddresses()
  }, [loadAddresses])

  function openCreateForm() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, isDefault: addresses.length === 0 })
    setIsFormOpen(true)
  }

  function openEditForm(address: CustomerAddress) {
    setEditingId(address.id)
    setForm({
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      zipcode: address.zipcode,
      address1: address.address1,
      address2: address.address2 ?? '',
      isDefault: address.isDefault,
    })
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const fieldErrors = validateCustomerAddressInput(form)
    const validationError = getFirstFieldError(fieldErrors)

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    await runGuardedSubmit(isSubmitting, setIsSubmitting, async () => {
      try {
        if (editingId) {
          const updated = await updateCustomerAddress(editingId, form)
          setAddresses((current) =>
            current
              .map((address) => (address.id === updated.id ? updated : address))
              .map((address) =>
                updated.isDefault && address.id !== updated.id
                  ? { ...address, isDefault: false }
                  : address,
              )
              .sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
          )
        } else {
          const created = await createCustomerAddress(form)
          setAddresses((current) => {
            const withoutDefaults = created.isDefault
              ? current.map((address) => ({ ...address, isDefault: false }))
              : current

            return [created, ...withoutDefaults]
          })
        }

        closeForm()
      } catch (error) {
        setErrorMessage(
          error instanceof CustomerAddressRepositoryError
            ? error.message
            : '배송지 저장에 실패했습니다.',
        )
      }
    })
  }

  async function handleDelete(addressId: string) {
    if (!window.confirm('이 배송지를 삭제할까요?')) {
      return
    }

    setErrorMessage(null)

    try {
      await deleteCustomerAddress(addressId)
      setAddresses((current) => current.filter((address) => address.id !== addressId))
    } catch (error) {
      setErrorMessage(
        error instanceof CustomerAddressRepositoryError
          ? error.message
          : '배송지 삭제에 실패했습니다.',
      )
    }
  }

  async function handleSetDefault(addressId: string) {
    setErrorMessage(null)

    try {
      await setDefaultCustomerAddress(addressId)
      setAddresses((current) =>
        current.map((address) => ({
          ...address,
          isDefault: address.id === addressId,
        })),
      )
    } catch (error) {
      setErrorMessage(
        error instanceof CustomerAddressRepositoryError
          ? error.message
          : '기본 배송지 설정에 실패했습니다.',
      )
    }
  }

  return (
    <MyPageShell title="배송지 관리" description="자주 사용하는 배송지를 등록하고 관리할 수 있습니다.">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          배송지 추가
        </button>
      </div>

      {errorMessage ? (
        <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {isFormOpen ? (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="mb-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-lg font-semibold text-neutral-900">
            {editingId ? '배송지 수정' : '배송지 추가'}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-neutral-700">배송지명</span>
              <input
                value={form.label}
                onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="집, 회사"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-neutral-700">받는 분</span>
              <input
                value={form.recipientName}
                onChange={(event) => setForm((prev) => ({ ...prev, recipientName: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-neutral-700">연락처</span>
              <input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                required
              />
            </label>
          </div>

          <AddressSearchFields
            variant="mypage"
            postalCode={form.zipcode}
            address={form.address1}
            addressDetail={form.address2 ?? ''}
            onPostalCodeChange={(value) => setForm((prev) => ({ ...prev, zipcode: value }))}
            onAddressChange={(value) => setForm((prev) => ({ ...prev, address1: value }))}
            onAddressDetailChange={(value) => setForm((prev) => ({ ...prev, address2: value }))}
            disabled={isSubmitting}
            addressDetailRequired={false}
          />

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
            />
            기본 배송지로 설정
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
            >
              취소
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-500 shadow-sm">
          배송지를 불러오는 중...
        </p>
      ) : addresses.length === 0 ? (
        <MyPageEmptyState
          title="등록된 배송지가 없습니다"
          description="주문 시 사용할 배송지를 추가해주세요."
          actionLabel="배송지 추가"
          onAction={openCreateForm}
          icon={<MapPin className="h-6 w-6" aria-hidden />}
        />
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-neutral-900">{address.label}</p>
                    {address.isDefault ? (
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white">
                        기본
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-neutral-800">
                    {address.recipientName} · {address.phone}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    ({address.zipcode}) {address.address1} {address.address2 ?? ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!address.isDefault ? (
                    <button
                      type="button"
                      onClick={() => void handleSetDefault(address.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700"
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden />
                      기본 설정
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openEditForm(address)}
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(address.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    삭제
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </MyPageShell>
  )
}
