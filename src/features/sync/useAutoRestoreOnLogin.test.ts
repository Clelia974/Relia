import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAutoRestoreOnLogin } from '@/features/sync/useAutoRestoreOnLogin'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

const { useAuthMock, fetchWorkspaceBackupMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  fetchWorkspaceBackupMock: vi.fn(),
}))
vi.mock('@/hooks/useAuth', () => ({ useAuth: useAuthMock }))
vi.mock('@/features/sync/workspaceBackup', () => ({ fetchWorkspaceBackup: fetchWorkspaceBackupMock }))

function mockAuth(isAuthenticated: boolean, userId = 'u1') {
  useAuthMock.mockReturnValue({
    user: isAuthenticated ? { id: userId, email: 'sophie@example.com' } : null,
    isLoading: false,
    isAuthenticated,
    logout: vi.fn(),
  })
}

let userCounter = 0
/** Un id unique par test : le hook ne tente qu'une fois par utilisateur (singleton module-level, cf. useAutoRestoreOnLogin.ts) — un id partagé entre tests ferait dépendre le résultat de l'ordre d'exécution. */
function freshUserId() {
  userCounter += 1
  return `user-${userCounter}`
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  fetchWorkspaceBackupMock.mockReset()
})

describe('useAutoRestoreOnLogin', () => {
  it("ne tente rien sans utilisateur connecté", () => {
    mockAuth(false)

    const { result } = renderHook(() => useAutoRestoreOnLogin())

    expect(result.current.isRestoring).toBe(false)
    expect(fetchWorkspaceBackupMock).not.toHaveBeenCalled()
  })

  it("ne tente rien si l'espace local est déjà onboardé (ne jamais écraser un travail en cours)", () => {
    mockAuth(true, freshUserId())
    useWorkspaceStore.getState().completeOnboarding()

    const { result } = renderHook(() => useAutoRestoreOnLogin())

    expect(result.current.isRestoring).toBe(false)
    expect(fetchWorkspaceBackupMock).not.toHaveBeenCalled()
  })

  it("restaure l'espace de travail quand une sauvegarde cloud existe et qu'aucun espace local n'est onboardé", async () => {
    const workspace = { ...createEmptyWorkspace(), userProfile: { ...createEmptyWorkspace().userProfile, onboarded: true, displayName: 'Restaurée' } }
    mockAuth(true, freshUserId())
    fetchWorkspaceBackupMock.mockResolvedValue({ found: true, workspace })

    const { result } = renderHook(() => useAutoRestoreOnLogin())

    expect(result.current.isRestoring).toBe(true)
    await waitFor(() => expect(result.current.isRestoring).toBe(false))
    expect(useWorkspaceStore.getState().workspace.userProfile.displayName).toBe('Restaurée')
  })

  it("ne remplace rien quand aucune sauvegarde cloud n'existe (found: false)", async () => {
    mockAuth(true, freshUserId())
    fetchWorkspaceBackupMock.mockResolvedValue({ found: false, workspace: null })

    const { result } = renderHook(() => useAutoRestoreOnLogin())

    await waitFor(() => expect(result.current.isRestoring).toBe(false))
    expect(useWorkspaceStore.getState().workspace.userProfile.onboarded).toBe(false)
  })

  it('un échec réseau ne bloque jamais : isRestoring repasse à false, signalé en console', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockAuth(true, freshUserId())
    fetchWorkspaceBackupMock.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useAutoRestoreOnLogin())

    await waitFor(() => expect(result.current.isRestoring).toBe(false))
    expect(errorSpy).toHaveBeenCalledOnce()
  })

  it('ne tente pas deux fois pour le même utilisateur (remontage de ProtectedRoute au changement de route)', async () => {
    const userId = freshUserId()
    mockAuth(true, userId)
    fetchWorkspaceBackupMock.mockResolvedValue({ found: false, workspace: null })

    const { result, unmount } = renderHook(() => useAutoRestoreOnLogin())
    await waitFor(() => expect(result.current.isRestoring).toBe(false))
    unmount()

    renderHook(() => useAutoRestoreOnLogin())

    expect(fetchWorkspaceBackupMock).toHaveBeenCalledTimes(1)
  })
})
