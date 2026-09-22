import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

/**
 * Seul module de ce repo à mocker un module (`@/lib/supabase`) plutôt que
 * de passer par le store réel — useAuth parle à un service externe
 * (Supabase), il n'y a pas d'équivalent "état réel manipulable" comme pour
 * useWorkspaceStore ailleurs dans la suite.
 */
const { getSessionMock, onAuthStateChangeMock, signOutMock, unsubscribeMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  signOutMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: signOutMock,
    },
  },
}))

beforeEach(() => {
  getSessionMock.mockReset().mockResolvedValue({ data: { session: null } })
  onAuthStateChangeMock.mockReset().mockReturnValue({ data: { subscription: { unsubscribe: unsubscribeMock } } })
  signOutMock.mockReset().mockResolvedValue({ error: null })
})

describe('useAuth (session Supabase réelle — Étape 1)', () => {
  it('démarre en isLoading tant que la session Supabase (getSession) n’a pas répondu', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('sans session : isAuthenticated à false et user à null une fois résolu', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('avec une session : expose user (id/email) et isAuthenticated à true', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'u1', email: 'sophie@example.com' } } } })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))
    expect(result.current.user).toEqual({ id: 'u1', email: 'sophie@example.com' })
  })

  it('logout appelle supabase.auth.signOut et efface la session locale', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'u1', email: 'sophie@example.com' } } } })
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    await act(() => result.current.logout())

    expect(signOutMock).toHaveBeenCalledTimes(1)
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('se désabonne du changement d’état auth au démontage', async () => {
    const { result, unmount } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    unmount()

    expect(unsubscribeMock).toHaveBeenCalledTimes(1)
  })
})
