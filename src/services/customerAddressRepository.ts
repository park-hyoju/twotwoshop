import type { PostgrestError } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { CustomerAddress, CustomerAddressInput } from '../types/mypage'
import { logSupabaseError as logRepositoryError } from '../utils/errorLog'
import {
  getFirstFieldError,
  sanitizeCustomerAddressInput,
  validateCustomerAddressInput,
} from '../utils/validators'

export class CustomerAddressRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'CustomerAddressRepositoryError'
    this.cause = cause
  }
}

interface CustomerAddressRow {
  id: string
  user_id: string
  label: string
  recipient_name: string
  phone: string
  zipcode: string
  address1: string
  address2: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

const ADDRESS_SELECT =
  'id, user_id, label, recipient_name, phone, zipcode, address1, address2, is_default, created_at, updated_at'

function mapAddressRow(row: CustomerAddressRow): CustomerAddress {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    zipcode: row.zipcode,
    address1: row.address1,
    address2: row.address2,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new CustomerAddressRepositoryError('배송지 정보를 불러올 수 없습니다.')
  }
}

function logSupabaseError(action: string, error: PostgrestError): void {
  logRepositoryError(`customerAddressRepository.${action}`, error)
}

function mapSupabaseError(action: string, error: PostgrestError): CustomerAddressRepositoryError {
  logSupabaseError(action, error)

  if (error.code === 'PGRST205' || error.message.includes("Could not find the table 'public.customer_addresses'")) {
    return new CustomerAddressRepositoryError(
      '배송지 테이블이 준비되지 않았습니다. Supabase SQL Editor에서 supabase/customer-addresses.sql을 실행해주세요.',
      error,
    )
  }

  if (error.code === '42501' || error.message.toLowerCase().includes('row-level security')) {
    return new CustomerAddressRepositoryError(
      '배송지 저장 권한이 없습니다. 로그인 상태를 확인해주세요.',
      error,
    )
  }

  const messages: Record<string, string> = {
    create: '배송지 추가에 실패했습니다.',
    update: '배송지 수정에 실패했습니다.',
    delete: '배송지 삭제에 실패했습니다.',
    fetch: '배송지 목록을 불러오지 못했습니다.',
    setDefault: '기본 배송지 설정에 실패했습니다.',
  }

  return new CustomerAddressRepositoryError(messages[action] ?? '배송지 처리에 실패했습니다.', error)
}

function buildAddressPayload(input: CustomerAddressInput) {
  const sanitized = sanitizeCustomerAddressInput(input)

  return {
    label: sanitized.label || '집',
    recipient_name: sanitized.recipientName,
    phone: sanitized.phone,
    zipcode: sanitized.zipcode,
    address1: sanitized.address1,
    address2: sanitized.address2 || null,
    is_default: sanitized.isDefault ?? false,
  }
}

function validateAddressPayload(input: CustomerAddressInput): void {
  const errors = validateCustomerAddressInput(input)
  const message = getFirstFieldError(errors)

  if (message) {
    throw new CustomerAddressRepositoryError(message)
  }
}

async function assertAuthenticatedUser(): Promise<void> {
  const { data, error } = await supabase!.auth.getUser()

  if (error || !data.user) {
    throw new CustomerAddressRepositoryError('로그인이 필요합니다.', error)
  }
}

export async function fetchDefaultCustomerAddress(): Promise<CustomerAddress | null> {
  try {
    const addresses = await fetchCustomerAddresses()
    const defaults = addresses
      .filter((address) => address.isDefault)
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      )

    return defaults[0] ?? null
  } catch (error) {
    console.warn('[customerAddressRepository] fetchDefaultCustomerAddress failed', error)
    return null
  }
}

export async function saveCheckoutAddressAsDefault(
  input: CustomerAddressInput,
  existingAddressId?: string | null,
): Promise<void> {
  assertSupabaseReady()
  await assertAuthenticatedUser()

  const payload: CustomerAddressInput = {
    ...input,
    isDefault: true,
  }

  if (existingAddressId) {
    await updateCustomerAddress(existingAddressId, payload)
    return
  }

  const addresses = await fetchCustomerAddresses()
  const matched = addresses.find(
    (address) =>
      address.recipientName.trim() === payload.recipientName &&
      address.phone.trim() === payload.phone &&
      address.zipcode.trim() === payload.zipcode &&
      address.address1.trim() === payload.address1 &&
      (address.address2 ?? '').trim() === (payload.address2 ?? '').trim(),
  )

  if (matched) {
    await updateCustomerAddress(matched.id, payload)
    return
  }

  await createCustomerAddress(payload)
}

export async function fetchCustomerAddresses(): Promise<CustomerAddress[]> {
  assertSupabaseReady()
  await assertAuthenticatedUser()

  const { data, error } = await supabase!
    .from('customer_addresses')
    .select(ADDRESS_SELECT)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw mapSupabaseError('fetch', error)
  }

  return (data as CustomerAddressRow[]).map(mapAddressRow)
}

export async function createCustomerAddress(input: CustomerAddressInput): Promise<CustomerAddress> {
  assertSupabaseReady()
  await assertAuthenticatedUser()

  validateAddressPayload(input)
  const payload = buildAddressPayload(input)

  // user_id is set by DB default auth.uid() + RLS with_check — never sent from client
  const { data, error } = await supabase!
    .from('customer_addresses')
    .insert(payload)
    .select(ADDRESS_SELECT)
    .single()

  if (error) {
    throw mapSupabaseError('create', error)
  }

  return mapAddressRow(data as CustomerAddressRow)
}

export async function updateCustomerAddress(
  addressId: string,
  input: CustomerAddressInput,
): Promise<CustomerAddress> {
  assertSupabaseReady()
  await assertAuthenticatedUser()

  validateAddressPayload(input)
  const payload = buildAddressPayload(input)

  const { data, error } = await supabase!
    .from('customer_addresses')
    .update(payload)
    .eq('id', addressId)
    .select(ADDRESS_SELECT)
    .single()

  if (error) {
    throw mapSupabaseError('update', error)
  }

  return mapAddressRow(data as CustomerAddressRow)
}

export async function deleteCustomerAddress(addressId: string): Promise<void> {
  assertSupabaseReady()
  await assertAuthenticatedUser()

  const { error } = await supabase!.from('customer_addresses').delete().eq('id', addressId)

  if (error) {
    throw mapSupabaseError('delete', error)
  }
}

export async function setDefaultCustomerAddress(addressId: string): Promise<void> {
  assertSupabaseReady()
  await assertAuthenticatedUser()

  const { error } = await supabase!
    .from('customer_addresses')
    .update({ is_default: true })
    .eq('id', addressId)

  if (error) {
    throw mapSupabaseError('setDefault', error)
  }
}
