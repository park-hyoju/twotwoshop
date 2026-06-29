import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type {
  GuestRestockSubscribeInput,
  RestockSubscribeResult,
} from '../types/restockNotification'
import { resolveProductUuid } from './userProfileRepository'

export class RestockNotificationRepositoryError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'RestockNotificationRepositoryError'
    this.cause = cause
  }
}

function assertSupabaseReady(): void {
  if (!isSupabaseConfigured || !supabase) {
    throw new RestockNotificationRepositoryError(
      '재입고 알림은 현재 온라인 상품에서만 신청할 수 있습니다.',
    )
  }
}

function parseSubscribeResult(data: unknown): RestockSubscribeResult {
  if (
    data &&
    typeof data === 'object' &&
    'status' in data &&
    (data.status === 'created' || data.status === 'already_subscribed')
  ) {
    return { status: data.status }
  }

  throw new RestockNotificationRepositoryError('재입고 알림 신청 결과를 확인하지 못했습니다.')
}

function mapRpcError(error: { message?: string }): never {
  const message = error.message ?? ''

  if (message.includes('NOT_AUTHENTICATED')) {
    throw new RestockNotificationRepositoryError('로그인이 필요합니다.')
  }

  if (message.includes('PRODUCT_NOT_FOUND')) {
    throw new RestockNotificationRepositoryError('상품 정보를 찾을 수 없습니다.')
  }

  if (message.includes('NAME_REQUIRED')) {
    throw new RestockNotificationRepositoryError('이름을 입력해주세요.')
  }

  if (message.includes('PHONE_REQUIRED')) {
    throw new RestockNotificationRepositoryError('연락처를 입력해주세요.')
  }

  throw new RestockNotificationRepositoryError('재입고 알림 신청에 실패했습니다.', error)
}

export async function subscribeMemberRestockNotification(
  productId: string,
  slug: string,
): Promise<RestockSubscribeResult> {
  assertSupabaseReady()

  const resolvedProductId = await resolveProductUuid(productId, slug)

  if (!resolvedProductId) {
    throw new RestockNotificationRepositoryError('상품 정보를 찾을 수 없습니다.')
  }

  const { data, error } = await supabase!.rpc('subscribe_restock_notification_member', {
    p_product_id: resolvedProductId,
  })

  if (error) {
    mapRpcError(error)
  }

  return parseSubscribeResult(data)
}

export async function subscribeGuestRestockNotification(
  productId: string,
  slug: string,
  input: Omit<GuestRestockSubscribeInput, 'productId'>,
): Promise<RestockSubscribeResult> {
  assertSupabaseReady()

  const resolvedProductId = await resolveProductUuid(productId, slug)

  if (!resolvedProductId) {
    throw new RestockNotificationRepositoryError('상품 정보를 찾을 수 없습니다.')
  }

  const { data, error } = await supabase!.rpc('subscribe_restock_notification_guest', {
    p_product_id: resolvedProductId,
    p_customer_name: input.customerName.trim(),
    p_phone: input.phone.trim(),
    p_email: input.email?.trim() || null,
  })

  if (error) {
    mapRpcError(error)
  }

  return parseSubscribeResult(data)
}

export async function subscribeGuestRestockNotificationForProduct(
  productId: string,
  slug: string,
  input: Omit<GuestRestockSubscribeInput, 'productId'>,
): Promise<RestockSubscribeResult> {
  return subscribeGuestRestockNotification(productId, slug, input)
}
