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

function mockAuth(isAuthenticated: boolean) {
  useAuthMock.mockReturnValue({
    user: isAuthenticated ? { id: 'u1', email: 'sophie@example.com' } : null,
    isLoading: false,
    isAuthenticated,
    logout: vi.fn(),
  })
}

beforeEach(() => mockAuth(true))

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

  it("renvoie vers l'onboarding quand authentifié mais l'espace de travail n'est pas onboardé", () => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })

    renderProtected(true)

    expect(screen.getByText('Page onboarding')).toBeInTheDocument()
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument()
  })

  it("rend le contenu quand authentifié et l'espace de travail est onboardé", () => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    useWorkspaceStore.getState().completeOnboarding()

    renderProtected(true)

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument()
  })

  it("rend le contenu sans exiger d'espace de travail quand requireWorkspace vaut false", () => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })

    renderProtected(false)

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument()
  })
})
