import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ANNUAL_FREE_MONTHS, FAQ, PRICE_ANNUAL, PRICE_MONTHLY } from '@/features/landing/landingContent'
import { ProductPage } from '@/pages/ProductPage'
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
        <ProductPage />
        <Where />
      </MemoryRouter>
    </TooltipProvider>,
  )
}

describe('ProductPage', () => {
  it('a un seul titre principal et les sections attendues, sans doublon', () => {
    setup()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual([
      'Ta journée avec SilkyPlace',
      'Chaque fonctionnalité part d’un problème réel',
      'Commence en trois étapes',
      'Quelle est la date du mariage ?',
      'Avant SilkyPlace. Avec SilkyPlace.',
      'Et le temps que tu récupères, tu en fais quoi ?',
      '14 jours pour essayer SilkyPlace',
      'Tout ce que tu te demandes avant de commencer',
      'Tu as un mariage à organiser ?',
    ])
  })

  it('sans compte : le bouton principal mène à l’inscription', () => {
    setup()
    fireEvent.click(screen.getAllByRole('button', { name: /Commencer mon premier mariage/ })[0])
    expect(screen.getByTestId('where').textContent).toBe('/inscription')
  })

  it('les tarifs suivent le choix mensuel / annuel, avec le bon calcul de l’économie', () => {
    setup()
    const pricing = within(screen.getByRole('heading', { name: '14 jours pour essayer SilkyPlace' }).closest('section')!)
    expect(pricing.getByText(`${PRICE_MONTHLY} €`)).toBeTruthy()
    fireEvent.click(pricing.getByRole('button', { name: /Annuel/ }))
    expect(pricing.getByText(`${PRICE_ANNUAL} €`)).toBeTruthy()
    expect(ANNUAL_FREE_MONTHS).toBe(2)
  })

  it('la mention « bientôt » de l’abonnement a disparu maintenant que le paiement est réellement ouvert (Étape 3)', () => {
    setup()
    expect(screen.queryByText(/L’abonnement ouvre avec la connexion en ligne/)).toBeNull()
  })

  it('la FAQ répond aux huit questions', () => {
    setup()
    expect(FAQ).toHaveLength(8)
    for (const item of FAQ) expect(screen.getByText(item.q)).toBeTruthy()
  })

  it('choisir une fonctionnalité affiche la capture réelle de l’écran dans le portable', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Désinstallation et retour/ }))
    expect(screen.getByRole('img', { name: /désinstallation/i })).toHaveAttribute('src', '/landing/desinstallation.jpg')
  })

  it('la frise « Ta journée avec SilkyPlace » se parcourt au clic, la conclusion n’apparaît qu’à 21h', () => {
    setup()
    expect(screen.getByText(/Tu ouvres SilkyPlace/)).toBeInTheDocument()
    expect(screen.queryByText(/Rien à installer, rien à paramétrer/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '21h00' }))
    expect(screen.getByText(/Rien à installer, rien à paramétrer/)).toBeInTheDocument()
  })

  it("offre de lancement disponible : affiche le nombre réel de places restantes, jamais un chiffre codé en dur", () => {
    useLaunchOfferAvailabilityMock.mockReturnValue({ offer: { limit: 100, redeemed: 63, remaining: 37, available: true }, isLoading: false })
    setup()
    expect(screen.getByText(/37 places restantes sur 100/)).toBeInTheDocument()
  })

  it("offre de lancement épuisée ou pas encore chargée : aucune bannière (pas de fausse urgence par défaut)", () => {
    useLaunchOfferAvailabilityMock.mockReturnValue({ offer: { limit: 100, redeemed: 100, remaining: 0, available: false }, isLoading: false })
    setup()
    expect(screen.queryByText(/offre de lancement/i)).not.toBeInTheDocument()
  })

  it('offre de lancement en annuel : distingue le mois offert de la remise annuelle, ne dit jamais "3 mois offerts"', () => {
    useLaunchOfferAvailabilityMock.mockReturnValue({ offer: { limit: 100, redeemed: 0, remaining: 100, available: true }, isLoading: false })
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Annuel/ }))

    expect(screen.getByText(/290 €\/an au lieu de 348 €\/an/)).toBeInTheDocument()
    expect(screen.queryByText(/3 mois offerts/i)).not.toBeInTheDocument()
  })
})
