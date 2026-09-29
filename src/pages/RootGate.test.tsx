import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RootGate } from '@/pages/RootGate'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

/** LandingPage parle à Supabase (useAuth) et à /api/launch-offer-count — mockés pour isoler le routage testé ici. */
const useAuthMock = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/useAuth', () => ({ useAuth: useAuthMock }))

const useLaunchOfferAvailabilityMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/payment/useLaunchOfferAvailability', () => ({ useLaunchOfferAvailability: useLaunchOfferAvailabilityMock }))

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  useAuthMock.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false, logout: vi.fn() })
  useLaunchOfferAvailabilityMock.mockReturnValue({ isAvailable: false, remaining: 0, isLoading: false })
})

function renderAt(hostname: string) {
  vi.stubGlobal('location', { ...window.location, hostname })
  render(
    <MemoryRouter>
      <TooltipProvider>
        <RootGate />
      </TooltipProvider>
    </MemoryRouter>,
  )
}

describe('RootGate — routage par nom d’hôte', () => {
  it('affiche la landing Zordi sur zordi.evenementscles.com', () => {
    renderAt('zordi.evenementscles.com')
    expect(screen.getByText('Zordi est encore en construction. Rejoins les premières décoratrices qui veulent suivre l’aventure.')).toBeInTheDocument()
  })

  it('affiche la landing "lancement" sur relia.evenementscles.com', () => {
    renderAt('relia.evenementscles.com')
    expect(screen.getByText('Quelle est la date du mariage ?')).toBeInTheDocument()
    expect(screen.queryByText(/Zordi est encore en construction/)).toBeNull()
  })

  it('affiche la landing "lancement" par défaut (autre hôte, ex. preview Vercel)', () => {
    renderAt('relia-abc123.vercel.app')
    expect(screen.getByText('Quelle est la date du mariage ?')).toBeInTheDocument()
    expect(screen.queryByText(/Zordi est encore en construction/)).toBeNull()
  })
})
