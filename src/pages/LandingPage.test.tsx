import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TESTIMONIALS } from '@/features/landing/landingContent'
import { LandingPage } from '@/pages/LandingPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

/** useAuth parle à Supabase (réseau) — mocké ici pour isoler la page, comme ProtectedRoute.test.tsx/AuthenticatedHeader.test.tsx. */
const useAuthMock = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/useAuth', () => ({ useAuth: useAuthMock }))

/** Même raison : évite un vrai fetch('/api/launch-offer-count') dans les tests, et permet de tester l'offre affichée/masquée de façon déterministe. */
const useLaunchOfferAvailabilityMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/payment/useLaunchOfferAvailability', () => ({ useLaunchOfferAvailability: useLaunchOfferAvailabilityMock }))

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
  // Par défaut, offre indisponible — la plupart des tests ne concernent pas l'offre de lancement.
  useLaunchOfferAvailabilityMock.mockReturnValue({ offer: null, isLoading: false })
})

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function setup() {
  render(
    <TooltipProvider>
      <MemoryRouter>
        <LandingPage />
        <Where />
      </MemoryRouter>
    </TooltipProvider>,
  )
}

describe('LandingPage', () => {
  it('a un seul titre principal : la promesse de la marque', () => {
    setup()
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0].textContent).toBe('Tu sais où tu en es, sur chaque mariage. Ferme ton ordi sans arrière-pensée.')
  })

  it("sans compte : le bouton principal mène à la page produit", () => {
    setup()
    fireEvent.click(screen.getAllByRole('button', { name: /Voir comment ça marche en 1 minute/ })[0])
    expect(screen.getByTestId('where').textContent).toBe('/produit')
  })

  it("avec un compte mais sans espace onboardé : le bouton principal mène à l'onboarding", () => {
    mockAuth(true)
    setup()
    fireEvent.click(screen.getAllByRole('button', { name: 'Continuer' })[0])
    expect(screen.getByTestId('where').textContent).toBe('/onboarding')
  })

  it("avec un compte et un espace onboardé : le bouton principal ouvre l'application", () => {
    mockAuth(true)
    useWorkspaceStore.getState().completeOnboarding()
    setup()
    fireEvent.click(screen.getAllByRole('button', { name: "Ouvrir l'application" })[0])
    expect(screen.getByTestId('where').textContent).toBe('/aujourdhui')
  })

  it('« Voir une démo » charge des mariages fictifs ; sans compte, renvoie vers l’inscription (les données seront déjà là une fois connecté·e)', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Voir une démo' }))
    expect(useWorkspaceStore.getState().workspace.weddings.length).toBeGreaterThan(0)
    expect(screen.getByTestId('where').textContent).toBe('/inscription')
  })

  it('« Voir une démo » avec un compte : ouvre directement le tableau de bord', () => {
    mockAuth(true)
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Voir une démo' }))
    expect(useWorkspaceStore.getState().workspace.weddings.length).toBeGreaterThan(0)
    expect(screen.getByTestId('where').textContent).toBe('/aujourdhui')
  })

  it('les sections attendues sont présentes, dans un ordre lisible', () => {
    setup()
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual([
      'Tu connais déjà ces moments',
      'Tu as un mariage à organiser ?',
    ])
  })

  it('n’invente ni témoignage, ni chiffre d’audience, ni mode hors-ligne, ni « aucune inscription »', () => {
    expect(TESTIMONIALS).toEqual([])
    setup()
    expect(screen.queryByRole('heading', { name: /Ce que disent/ })).toBeNull()
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/500\+/)
    expect(text).not.toMatch(/100\s?%\s?offline|100\s?%\s?hors/i)
    expect(text).not.toMatch(/rappel/i)
    expect(text).not.toMatch(/aucune inscription/i)
  })

  it('sans compte : pas d’en-tête authentifié', () => {
    setup()
    expect(screen.queryByRole('button', { name: "Aller à mon application" })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Menu du compte' })).not.toBeInTheDocument()
  })

  it('avec un compte : l’en-tête authentifié apparaît (CTA + menu compte)', () => {
    mockAuth(true)
    setup()
    expect(screen.getByRole('button', { name: "Aller à mon application" })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Menu du compte' })).toBeInTheDocument()
  })

  it('toutes les images ont un texte alternatif et des dimensions', () => {
    setup()
    for (const img of screen.getAllByRole('img')) {
      expect(img.getAttribute('alt')?.length).toBeGreaterThan(10)
      expect(img.getAttribute('width')).toBeTruthy()
      expect(img.getAttribute('height')).toBeTruthy()
    }
  })
})
