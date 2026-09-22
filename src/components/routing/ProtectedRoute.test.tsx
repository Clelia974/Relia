import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

/**
 * useAuth est un mock à isAuthenticated: true tant que Supabase Auth (Phase
 * 1) n'est pas branché (cf. src/hooks/useAuth.ts) — la branche "non
 * authentifié" de ProtectedRoute n'est donc pas exerçable ici ; seule la
 * garde sur l'espace de travail l'est réellement aujourd'hui.
 */
function renderProtected(requireWorkspace: boolean, initialPath = '/protege') {
  const router = createMemoryRouter(
    [
      { path: '/onboarding', element: <p>Page onboarding</p> },
      { path: '/protege', element: <ProtectedRoute requireWorkspace={requireWorkspace}>Contenu protégé</ProtectedRoute> },
    ],
    { initialEntries: [initialPath] },
  )
  return render(<RouterProvider router={router} />)
}

describe('ProtectedRoute', () => {
  it("renvoie vers l'onboarding quand l'espace de travail n'est pas onboardé", () => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })

    renderProtected(true)

    expect(screen.getByText('Page onboarding')).toBeInTheDocument()
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument()
  })

  it("rend le contenu quand l'espace de travail est onboardé", () => {
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
