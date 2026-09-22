import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

/**
 * useAuth parle à Supabase (réseau) — on le mocke ici pour isoler
 * ProtectedRoute, comme AuthenticatedHeader.test.tsx. useWorkspaceCheck
 * reste réel (dérivé du store, sans dépendance externe).
 */
const useAuthMock = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/useAuth', () => ({ useAuth: useAuthMock }))

/** ProtectedRoute tente une restauration cloud (useAutoRestoreOnLogin) — mockée ici, "found: false" partout (testée séparément dans useAutoRestoreOnLogin.test.ts). */
const fetchWorkspaceBackupMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/sync/workspaceBackup', () => ({ fetchWorkspaceBackup: fetchWorkspaceBackupMock }))

function mockAuth(isAuthenticated: boolean, userId = 'u1') {
  useAuthMock.mockReturnValue({
    user: isAuthenticated ? { id: userId, email: 'sophie@example.com' } : null,
    isLoading: false,
    isAuthenticated,
    logout: vi.fn(),
  })
}

beforeEach(() => {
  mockAuth(true)
  fetchWorkspaceBackupMock.mockReset().mockResolvedValue({ found: false, workspace: null })
})

function renderProtected(requireWorkspace: boolean, initialPath = '/protege') {
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>Landing publique</p> },
      { path: '/onboarding', element: <p>Page onboarding</p> },
      { path: '/protege', element: <ProtectedRoute requireWorkspace={requireWorkspace}>Contenu protégé</ProtectedRoute> },
    ],
    { initialEntries: [initialPath] },
  )
  return render(<RouterProvider router={router} />)
}

describe('ProtectedRoute', () => {
  it('renvoie vers la landing quand non authentifié', () => {
    mockAuth(false)
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })

    renderProtected(true)

    expect(screen.getByText('Landing publique')).toBeInTheDocument()
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument()
  })

  it("renvoie vers l'onboarding quand authentifié mais l'espace de travail n'est pas onboardé", async () => {
    mockAuth(true, 'u-sans-espace')
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })

    renderProtected(true)

    expect(await screen.findByText('Page onboarding')).toBeInTheDocument()
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument()
  })

  it("rend le contenu quand authentifié et l'espace de travail est onboardé", () => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    useWorkspaceStore.getState().completeOnboarding()

    renderProtected(true)

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument()
  })

  it("rend le contenu sans exiger d'espace de travail quand requireWorkspace vaut false", async () => {
    mockAuth(true, 'u-requireWorkspace-false')
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })

    renderProtected(false)

    expect(await screen.findByText('Contenu protégé')).toBeInTheDocument()
  })

  it('avec une sauvegarde cloud disponible et aucun espace local, restaure automatiquement puis rend le contenu', async () => {
    mockAuth(true, 'u-avec-sauvegarde')
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    fetchWorkspaceBackupMock.mockResolvedValue({
      found: true,
      workspace: { ...createEmptyWorkspace(), userProfile: { ...createEmptyWorkspace().userProfile, onboarded: true } },
    })

    renderProtected(true)

    expect(await screen.findByText('Contenu protégé')).toBeInTheDocument()
  })
})
