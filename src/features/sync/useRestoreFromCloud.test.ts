import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useRestoreFromCloud } from '@/features/sync/useRestoreFromCloud'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

const { useAuthMock, fetchWorkspaceBackupMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  fetchWorkspaceBackupMock: vi.fn(),
}))
vi.mock('@/hooks/useAuth', () => ({ useAuth: useAuthMock }))
vi.mock('@/features/sync/workspaceBackup', () => ({ fetchWorkspaceBackup: fetchWorkspaceBackupMock }))

function mockAuth(isAuthenticated: boolean) {
  useAuthMock.mockReturnValue({
    user: isAuthenticated ? { id: 'u1', email: 'sophie@example.com' } : null,
    isLoading: false,
    isAuthenticated,
    logout: vi.fn(),
  })
}

beforeEach(() => {
  mockAuth(true)
  fetchWorkspaceBackupMock.mockReset()
})

describe('useRestoreFromCloud', () => {
  it("retourne l'espace de travail trouvé dans le cloud, sans le remplacer lui-même", async () => {
    const backup = createEmptyWorkspace()
    fetchWorkspaceBackupMock.mockResolvedValue({ found: true, workspace: backup })
    const { result } = renderHook(() => useRestoreFromCloud())

    let returned: unknown
    await act(async () => {
      returned = await result.current.restoreNow()
    })

    expect(fetchWorkspaceBackupMock).toHaveBeenCalledWith('u1')
    expect(returned).toBe(backup)
    expect(result.current.error).toBeNull()
  })

  it('signale une erreur lisible quand aucune sauvegarde n’existe', async () => {
    fetchWorkspaceBackupMock.mockResolvedValue({ found: false, workspace: null })
    const { result } = renderHook(() => useRestoreFromCloud())

    let returned: unknown
    await act(async () => {
      returned = await result.current.restoreNow()
    })

    expect(returned).toBeNull()
    expect(result.current.error).toBeTruthy()
  })

  it('expose un message lisible en cas d’échec réseau, sans lever', async () => {
    fetchWorkspaceBackupMock.mockRejectedValue(new Error('RLS violation'))
    const { result } = renderHook(() => useRestoreFromCloud())

    let returned: unknown
    await act(async () => {
      returned = await result.current.restoreNow()
    })

    expect(returned).toBeNull()
    expect(result.current.error).toBe('RLS violation')
    expect(result.current.isRestoring).toBe(false)
  })

  it('refuse de restaurer sans compte connecté', async () => {
    mockAuth(false)
    const { result } = renderHook(() => useRestoreFromCloud())

    await act(() => result.current.restoreNow())

    expect(fetchWorkspaceBackupMock).not.toHaveBeenCalled()
    expect(result.current.error).toBeTruthy()
  })
})
