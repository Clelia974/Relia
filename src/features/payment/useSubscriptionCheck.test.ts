import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSubscriptionCheck } from '@/features/payment/useSubscriptionCheck'

const useUserProfileMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/auth/useUserProfile', () => ({ useUserProfile: useUserProfileMock }))

beforeEach(() => useUserProfileMock.mockReset())

describe('useSubscriptionCheck', () => {
  it('sans profil résolu : hasAccess/status restent undefined, jamais un accès accordé ou refusé par défaut', () => {
    useUserProfileMock.mockReturnValue({ profile: null, isLoading: true, error: null })

    const { result } = renderHook(() => useSubscriptionCheck())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.hasAccess).toBeUndefined()
    expect(result.current.status).toBeUndefined()
  })

  it('avec un profil en trial actif : accès accordé', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    useUserProfileMock.mockReturnValue({
      profile: { id: 'u1', email: 'sophie@example.com', trialEndDate: future, subscriptionStatus: 'trial', createdAt: '', updatedAt: '' },
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useSubscriptionCheck())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.status).toBe('trial')
    expect(result.current.hasAccess).toBe(true)
    expect(result.current.daysLeftInTrial).toBeGreaterThan(0)
  })

  it('avec un trial expiré depuis longtemps : accès refusé', () => {
    const longAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    useUserProfileMock.mockReturnValue({
      profile: { id: 'u1', email: 'sophie@example.com', trialEndDate: longAgo, subscriptionStatus: 'trial', createdAt: '', updatedAt: '' },
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useSubscriptionCheck())

    expect(result.current.status).toBe('expired')
    expect(result.current.hasAccess).toBe(false)
  })
})
