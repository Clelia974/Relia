import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSyncToCloud } from '@/features/sync/useSyncToCloud'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

const { useAuthMock, pushWorkspaceBackupMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  pushWorkspaceBackupMock: vi.fn(),
}))
vi.mock('@/hooks/useAuth', () => ({ useAuth: useAuthMock }))
vi.mock('@/features/sync/workspaceBackup', () => ({ pushWorkspaceBackup: pushWorkspaceBackupMock }))

function mockAuth(isAuthenticated: boolean) {
  useAuthMock.mockReturnValue({
    user: isAuthenticated ? { id: 'u1', email: 'sophie@example.com' } : null,
    isLoading: false,
    isAuthenticated,
    logout: vi.fn(),
  })
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  mockAuth(true)
  pushWorkspaceBackupMock.mockReset()
})

describe('useSyncToCloud', () => {
  it("pousse l'espace de travail local actuel vers le cloud", async () => {
    pushWorkspaceBackupMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useSyncToCloud())

    await act(() => result.current.syncNow())

    expect(pushWorkspaceBackupMock).toHaveBeenCalledWith('u1', useWorkspaceStore.getState().workspace)
    expect(result.current.error).toBeNull()
    expect(result.current.lastSyncedAt).not.toBeNull()
  })

  it('isSyncing passe à true pendant la synchronisation', async () => {
    let resolvePush!: () => void
    pushWorkspaceBackupMock.mockReturnValue(new Promise<void>((resolve) => (resolvePush = resolve)))
    const { result } = renderHook(() => useSyncToCloud())

    let syncPromise!: Promise<void>
    act(() => {
      syncPromise = result.current.syncNow()
    })
    expect(result.current.isSyncing).toBe(true)

    await act(async () => {
      resolvePush()
      await syncPromise
    })
    expect(result.current.isSyncing).toBe(false)
  })

  it('expose un message lisible en cas d’échec, sans lever', async () => {
    pushWorkspaceBackupMock.mockRejectedValue(new Error('RLS violation'))
    const { result } = renderHook(() => useSyncToCloud())

    await act(() => result.current.syncNow())

    expect(result.current.error).toBe('RLS violation')
    expect(result.current.isSyncing).toBe(false)
    expect(result.current.lastSyncedAt).toBeNull()
  })

  it('refuse de synchroniser sans compte connecté', async () => {
    mockAuth(false)
    const { result } = renderHook(() => useSyncToCloud())

    await act(() => result.current.syncNow())

    expect(pushWorkspaceBackupMock).not.toHaveBeenCalled()
    expect(result.current.error).toBeTruthy()
  })
})
