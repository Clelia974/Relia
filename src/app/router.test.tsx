import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppRouter } from '@/app/router'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

/** useAuth parle à Supabase (réseau) — mocké ici, comme les autres tests qui rendent des composants en dépendant. */
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

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  mockAuth(false)
})

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </TooltipProvider>,
  )
}

const appLayoutNav = () => screen.queryByRole('navigation', { name: 'Navigation principale' })

/**
 * ProtectedRoute est maintenant câblée (Étape 1, wiring) : compte requis
 * pour tout le reste de l'app (AppLayout) et pour l'onboarding — cf.
 * src/components/routing/README.md pour l'historique de la décision.
 */
describe('AppRouter — routing protégé', () => {
  it('« / » affiche la landing publique, sans en-tête authentifié, quand non connecté·e', () => {
    renderAt('/')

    expect(screen.getByRole('heading', { level: 1, name: 'Tout orchestré. Enfin la paix.' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: "Aller à mon application" })).not.toBeInTheDocument()
  })

  it('« / » affiche l’en-tête authentifié quand connecté·e', () => {
    mockAuth(true)
    renderAt('/')

    expect(screen.getByRole('button', { name: "Aller à mon application" })).toBeInTheDocument()
  })

  it('/aujourdhui sans compte renvoie vers la landing (pas de redirection en boucle, pas de fuite de contenu protégé)', () => {
    renderAt('/aujourdhui')

    expect(screen.getByRole('heading', { level: 1, name: 'Tout orchestré. Enfin la paix.' })).toBeInTheDocument()
    expect(appLayoutNav()).not.toBeInTheDocument()
  })

  it('/aujourdhui avec compte mais sans espace onboardé renvoie vers /onboarding', () => {
    mockAuth(true)
    renderAt('/aujourdhui')

    expect(screen.getByRole('heading', { name: /Combien de mariages gérez-vous/ })).toBeInTheDocument()
    expect(appLayoutNav()).not.toBeInTheDocument()
  })

  it('/aujourdhui avec compte et espace onboardé affiche l’app (sidebar)', () => {
    mockAuth(true)
    useWorkspaceStore.getState().completeOnboarding()
    renderAt('/aujourdhui')

    expect(appLayoutNav()).toBeInTheDocument()
  })

  it('/onboarding sans compte renvoie vers la landing', () => {
    renderAt('/onboarding')

    expect(screen.getByRole('heading', { level: 1, name: 'Tout orchestré. Enfin la paix.' })).toBeInTheDocument()
  })

  it('/onboarding avec compte (sans espace) reste accessible', () => {
    mockAuth(true)
    renderAt('/onboarding')

    expect(screen.getByRole('heading', { name: /Combien de mariages gérez-vous/ })).toBeInTheDocument()
  })

  it('les pages légales restent publiques, sans compte', () => {
    renderAt('/confidentialite')

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
