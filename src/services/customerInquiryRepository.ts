import { mapQuickKeyToDbInquiryType } from '../lib/chatInquiryTypes'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { isDbInquiryType, normalizeInquiryStatus } from '../lib/adminInquiryDisplay'
import { logSupabaseError } from '../utils/errorLog'
import {
  sanitizeInquiryInput,
  validateInquiryFormInput,
} from '../utils/validators'
import type { ChatInquiryQuickKey } from '../lib/chatInquiryTypes'
import type {
  CustomerInquiryIdentity,
  CustomerInquiryLookupInput,
  CustomerInquirySummary,
  CustomerInquiryThread,
} from '../types/customerInquiry'
import type { DbInquiryType } from '../types/adminInquiry'

export interface CustomerInquiryInput {
  quickKey: ChatInquiryQuickKey
  customerName: string
  customerPhone: string
  customerEmail: string
  orderReference: string
  message: string
  imageUrls: string[]
}

export class CustomerInquiryRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'CustomerInquiryRepositoryError'
    this.cause = cause
  }
}

function parseImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function parseThreadRow(data: unknown): CustomerInquiryThread | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const row = data as Record<string, unknown>

  if (
    typeof row.id !== 'string' ||
    typeof row.inquiry_code !== 'string' ||
    typeof row.name !== 'string' ||
    typeof row.phone !== 'string' ||
    typeof row.message !== 'string' ||
    typeof row.created_at !== 'string' ||
    typeof row.updated_at !== 'string' ||
    !isDbInquiryType(String(row.type))
  ) {
    return null
  }

  const messages = Array.isArray(row.messages)
    ? row.messages
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null
          }

          const messageRow = item as Record<string, unknown>

          if (
            typeof messageRow.id !== 'string' ||
            typeof messageRow.message !== 'string' ||
            typeof messageRow.created_at !== 'string' ||
            (messageRow.sender !== 'customer' && messageRow.sender !== 'admin')
          ) {
            return null
          }

          return {
            id: messageRow.id,
            sender: messageRow.sender,
            message: messageRow.message,
            image_urls: parseImageUrls(messageRow.image_urls),
            created_at: messageRow.created_at,
          }
        })
        .filter((item): item is CustomerInquiryThread['messages'][number] => item !== null)
    : []

  return {
    id: row.id,
    inquiry_code: row.inquiry_code,
    name: row.name,
    phone: row.phone,
    email: typeof row.email === 'string' ? row.email : null,
    type: row.type as DbInquiryType,
    status: normalizeInquiryStatus(String(row.status)),
    message: row.message,
    admin_reply: typeof row.admin_reply === 'string' ? row.admin_reply : null,
    image_urls: parseImageUrls(row.image_urls),
    order_reference: typeof row.order_reference === 'string' ? row.order_reference : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    messages,
  }
}

function parseSummaryRow(item: unknown): CustomerInquirySummary | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const row = item as Record<string, unknown>

  if (
    typeof row.id !== 'string' ||
    typeof row.message !== 'string' ||
    typeof row.created_at !== 'string' ||
    typeof row.updated_at !== 'string' ||
    !isDbInquiryType(String(row.type))
  ) {
    return null
  }

  return {
    id: row.id,
    type: row.type as DbInquiryType,
    status: normalizeInquiryStatus(String(row.status)),
    message: row.message,
    image_urls: parseImageUrls(row.image_urls),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function fetchPendingInquiryQueueCount(): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null
  }

  const { data, error } = await supabase.rpc('get_pending_inquiry_queue_count')

  if (error) {
    return null
  }

  return typeof data === 'number' ? data : null
}

export async function submitCustomerInquiry(
  input: CustomerInquiryInput,
): Promise<{ id: string }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new CustomerInquiryRepositoryError(
      '문의 접수를 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    )
  }

  const sanitized = sanitizeInquiryInput(input)
  const validationError = validateInquiryFormInput(sanitized)

  if (validationError) {
    throw new CustomerInquiryRepositoryError(validationError)
  }

  const { data, error } = await supabase.rpc('submit_customer_inquiry', {
    p_name: sanitized.customerName,
    p_phone: sanitized.customerPhone,
    p_email: sanitized.customerEmail,
    p_type: mapQuickKeyToDbInquiryType(input.quickKey),
    p_message: sanitized.message,
    p_image_urls: input.imageUrls,
    p_order_reference: sanitized.orderReference || null,
  })

  if (error) {
    logSupabaseError('customerInquiryRepository.submitCustomerInquiry', error)
    throw new CustomerInquiryRepositoryError(
      '문의 접수에 실패했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.',
      error,
    )
  }

  const id =
    data && typeof data === 'object' && 'id' in data ? String((data as { id: string }).id) : null

  if (!id) {
    throw new CustomerInquiryRepositoryError('문의 접수에 실패했습니다.')
  }

  return { id }
}

export async function lookupCustomerInquiriesByContact(
  input: CustomerInquiryLookupInput,
): Promise<CustomerInquirySummary[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new CustomerInquiryRepositoryError(
      '문의 조회를 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    )
  }

  const { data, error } = await supabase.rpc('get_customer_inquiries_by_contact', {
    p_name: input.name.trim(),
    p_phone: input.phone.trim(),
  })

  if (error) {
    throw new CustomerInquiryRepositoryError('문의 조회에 실패했습니다.', error)
  }

  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map(parseSummaryRow)
    .filter((item): item is CustomerInquirySummary => item !== null)
}

export async function fetchCustomerInquiryById(
  input: CustomerInquiryIdentity,
): Promise<CustomerInquiryThread | null> {
  if (!isSupabaseConfigured || !supabase) {
    throw new CustomerInquiryRepositoryError(
      '문의 조회를 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    )
  }

  const { data, error } = await supabase.rpc('get_customer_inquiry_by_id', {
    p_id: input.inquiryId,
    p_name: input.name.trim(),
    p_phone: input.phone.trim(),
  })

  if (error) {
    throw new CustomerInquiryRepositoryError('문의 조회에 실패했습니다.', error)
  }

  return parseThreadRow(data)
}

export async function addCustomerInquiryFollowUp(input: {
  inquiryId: string
  name: string
  phone: string
  message: string
  imageUrls?: string[]
}): Promise<CustomerInquiryThread | null> {
  if (!isSupabaseConfigured || !supabase) {
    throw new CustomerInquiryRepositoryError(
      '추가 질문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    )
  }

  const { data: insertResult, error: insertError } = await supabase.rpc(
    'add_customer_inquiry_message',
    {
      p_inquiry_id: input.inquiryId,
      p_name: input.name.trim(),
      p_phone: input.phone.trim(),
      p_message: input.message.trim(),
      p_image_urls: input.imageUrls ?? [],
    },
  )

  if (insertError) {
    throw new CustomerInquiryRepositoryError('추가 질문을 저장하지 못했습니다.', insertError)
  }

  if (!insertResult) {
    return null
  }

  return fetchCustomerInquiryById({
    inquiryId: input.inquiryId,
    name: input.name,
    phone: input.phone,
  })
}

export async function markCustomerInquiryAsRead(input: {
  inquiryId: string
  name: string
  phone: string
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return
  }

  const { error } = await supabase.rpc('mark_customer_inquiry_read', {
    p_inquiry_id: input.inquiryId,
    p_name: input.name.trim(),
    p_phone: input.phone.trim(),
  })

  if (error) {
    console.warn('[customerInquiryRepository] markCustomerInquiryAsRead failed', error.message)
  }
}
