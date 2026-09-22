import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWeddingLimit } from '@/features/payment/useWeddingLimit'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

const useSubscriptionCheckMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/payment/useSubscriptionCheck', () => ({ useSubscriptionCheck: useSubscriptionCheckMock }))

function seedWeddings(count: number) {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  for (let i = 0; i < count; i += 1) {
    useWorkspaceStore.getState().createWedding({
      coupleName: `Couple ${i}`,
      date: '2026-10-10T00:00:00.000Z',
      venue: '',
      soldAmount: 0,
      clientBudget: 0,
      status: 'signe',
    })
  }
}

beforeEach(() => useSubscriptionCheckMock.mockReset())

describe('useWeddingLimit', () => {
  it('essai en cours : autorisé même avec beaucoup de mariages', () => {
    useSubscriptionCheckMock.mockReturnValue({ status: 'trial' })
    seedWeddings(5)

    const { result } = renderHook(() => useWeddingLimit())

    expect(result.current.canCreate).toBe(true)
    expect(result.current.limitReached).toBe(false)
    expect(result.current.weddingCount).toBe(5)
  })

  it('Gratuit (expired) avec 2 mariages : encore autorisé', () => {
    useSubscriptionCheckMock.mockReturnValue({ status: 'expired' })
    seedWeddings(2)

    const { result } = renderHook(() => useWeddingLimit())

    expect(result.current.canCreate).toBe(true)
    expect(result.current.limitReached).toBe(false)
  })

  it('Gratuit (expired) avec 3 mariages : bloqué', () => {
    useSubscriptionCheckMock.mockReturnValue({ status: 'expired' })
    seedWeddings(3)

    const { result } = renderHook(() => useWeddingLimit())

    expect(result.current.canCreate).toBe(false)
    expect(result.current.limitReached).toBe(true)
    expect(result.current.limit).toBe(3)
  })

  it('Pro (active) avec 10 mariages : toujours autorisé', () => {
    useSubscriptionCheckMock.mockReturnValue({ status: 'active' })
    seedWeddings(10)

    const { result } = renderHook(() => useWeddingLimit())

    expect(result.current.canCreate).toBe(true)
  })
})
