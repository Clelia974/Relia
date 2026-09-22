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

/** ProtectedRoute tente une restauration cloud (useAutoRestoreOnLogin) — mockée ici pour ne jamais taper le vrai réseau ; "found: false" partout, ce n'est pas ce que ce fichier teste (cf. useAutoRestoreOnLogin.test.ts). */
const fetchWorkspaceBackupMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/sync/workspaceBackup', () => ({ fetchWorkspaceBackup: fetchWorkspaceBackupMock }))

/** userId distinct par défaut par test : useAutoRestoreOnLogin ne tente qu'une fois par utilisateur (singleton module), un id partagé entre tests ferait dépendre leur résultat de l'ordre d'exécution. */
function mockAuth(isAuthenticated: boolean, userId = 'u1') {
  useAuthMock.mockReturnValue({
    user: isAuthenticated ? { id: userId, email: 'sophie@example.com' } : null,
    isLoading: false,
    isAuthenticated,
    logout: vi.fn(),
  })
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  mockAuth(false)
  fetchWorkspaceBackupMock.mockReset().mockResolvedValue({ found: false, workspace: null })
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

  it('« / » affiche l’en-tête authentifié quand connecté·e', async () => {
    mockAuth(true)
    renderAt('/')

    expect(await screen.findByRole('button', { name: "Aller à mon application" })).toBeInTheDocument()
  })

  it('/aujourdhui sans compte renvoie vers la landing (pas de redirection en boucle, pas de fuite de contenu protégé)', () => {
    renderAt('/aujourdhui')

    expect(screen.getByRole('heading', { level: 1, name: 'Tout orchestré. Enfin la paix.' })).toBeInTheDocument()
    expect(appLayoutNav()).not.toBeInTheDocument()
  })

  it('/aujourdhui avec compte mais sans espace onboardé renvoie vers /onboarding', async () => {
    mockAuth(true)
    renderAt('/aujourdhui')

    expect(await screen.findByRole('heading', { name: /Combien de mariages gérez-vous/ })).toBeInTheDocument()
    expect(appLayoutNav()).not.toBeInTheDocument()
  })

  it('/aujourdhui avec compte et espace onboardé affiche l’app (sidebar)', async () => {
    mockAuth(true)
    useWorkspaceStore.getState().completeOnboarding()
    renderAt('/aujourdhui')

    expect(await screen.findByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
  })

  it('/onboarding sans compte renvoie vers la landing', () => {
    renderAt('/onboarding')

    expect(screen.getByRole('heading', { level: 1, name: 'Tout orchestré. Enfin la paix.' })).toBeInTheDocument()
  })

  it('/onboarding avec compte (sans espace) reste accessible', async () => {
    mockAuth(true)
    renderAt('/onboarding')

    expect(await screen.findByRole('heading', { name: /Combien de mariages gérez-vous/ })).toBeInTheDocument()
  })

  it('/aujourdhui avec compte, sans espace, mais une sauvegarde existe dans le cloud : restaure automatiquement et affiche l’app', async () => {
    mockAuth(true, 'u-avec-sauvegarde-cloud')
    fetchWorkspaceBackupMock.mockResolvedValue({
      found: true,
      workspace: { ...createEmptyWorkspace(), userProfile: { ...createEmptyWorkspace().userProfile, onboarded: true } },
    })
    renderAt('/aujourdhui')

    expect(await screen.findByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
    expect(useWorkspaceStore.getState().workspace.userProfile.onboarded).toBe(true)
  })

  it('les pages légales restent publiques, sans compte', () => {
    renderAt('/confidentialite')

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
