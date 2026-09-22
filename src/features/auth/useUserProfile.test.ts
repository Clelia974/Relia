import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useUserProfile } from '@/features/auth/useUserProfile'

const { useAuthMock, fetchOwnUserProfileMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  fetchOwnUserProfileMock: vi.fn(),
}))
vi.mock('@/hooks/useAuth', () => ({ useAuth: useAuthMock }))
vi.mock('@/features/auth/userProfile', () => ({ fetchOwnUserProfile: fetchOwnUserProfileMock }))

const profile = {
  id: 'u1',
  email: 'sophie@example.com',
  trialEndDate: '2026-10-06T00:00:00.000Z',
  subscriptionStatus: 'trial' as const,
  createdAt: '2026-09-22T00:00:00.000Z',
  updatedAt: '2026-09-22T00:00:00.000Z',
}

beforeEach(() => {
  fetchOwnUserProfileMock.mockReset()
})

afterEach(() => vi.restoreAllMocks())

describe('useUserProfile', () => {
  it('reste à null sans utilisateur connecté, sans appeler Supabase', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false, logout: vi.fn() })

    const { result } = renderHook(() => useUserProfile())

    expect(result.current.profile).toBeNull()
    expect(fetchOwnUserProfileMock).not.toHaveBeenCalled()
  })

  it('expose le profil une fois la lecture résolue', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', email: 'sophie@example.com' }, isLoading: false, isAuthenticated: true, logout: vi.fn() })
    fetchOwnUserProfileMock.mockResolvedValue(profile)

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.profile).toEqual(profile)
    expect(fetchOwnUserProfileMock).toHaveBeenCalledWith('u1')
  })

  it('signale (console.error) une ligne manquante sans lever d’erreur bloquante', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    useAuthMock.mockReturnValue({ user: { id: 'u1', email: 'sophie@example.com' }, isLoading: false, isAuthenticated: true, logout: vi.fn() })
    fetchOwnUserProfileMock.mockResolvedValue(null)

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.profile).toBeNull()
    expect(result.current.error).toBeNull()
    expect(errorSpy).toHaveBeenCalledOnce()
  })

  it('expose une erreur lisible si la lecture échoue', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'u1', email: 'sophie@example.com' }, isLoading: false, isAuthenticated: true, logout: vi.fn() })
    fetchOwnUserProfileMock.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => expect(result.current.error).toBe('Network error'))
    expect(result.current.profile).toBeNull()
  })
})
