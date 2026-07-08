import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AdminOrderRepositoryError, deleteAllAdminOrders } from './adminOrderRepository'

const mockRpc = vi.fn()
const mockDelete = vi.fn()
const mockGte = vi.fn()
const mockFrom = vi.fn()

vi.mock('../lib/adminRepositoryGuard', () => ({
  assertAdminRepositoryAccess: vi.fn(async () => undefined),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

describe('deleteAllAdminOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGte.mockReturnValue({ count: 3, error: null })
    mockDelete.mockReturnValue({ gte: mockGte })
    mockFrom.mockReturnValue({ delete: mockDelete })
  })

  it('returns count from admin_delete_all_orders RPC', async () => {
    mockRpc.mockResolvedValue({ data: 5, error: null })

    await expect(deleteAllAdminOrders()).resolves.toBe(5)
    expect(mockRpc).toHaveBeenCalledWith('admin_delete_all_orders')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('falls back to table delete when RPC is unavailable', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'function not found' } })

    await expect(deleteAllAdminOrders()).resolves.toBe(3)
    expect(mockFrom).toHaveBeenCalledWith('orders')
    expect(mockDelete).toHaveBeenCalledWith({ count: 'exact' })
  })

  it('throws AdminOrderRepositoryError when delete fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'function not found' } })
    mockGte.mockResolvedValue({ count: null, error: { message: 'permission denied' } })

    await expect(deleteAllAdminOrders()).rejects.toBeInstanceOf(AdminOrderRepositoryError)
  })
})
