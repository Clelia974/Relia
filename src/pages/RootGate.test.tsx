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
  it('affiche la landing Jordu sur jordu.evenementscles.com', () => {
    renderAt('jordu.evenementscles.com')
    expect(screen.getByText('Jordu est encore en construction. Rejoins les premières décoratrices qui veulent suivre l’aventure.')).toBeInTheDocument()
  })

  it('affiche la landing Relia sur relia.evenementscles.com', () => {
    renderAt('relia.evenementscles.com')
    expect(screen.getAllByText(/Relia/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Jordu est encore en construction/)).toBeNull()
  })

  it('affiche la landing Relia par défaut (autre hôte, ex. preview Vercel)', () => {
    renderAt('relia-abc123.vercel.app')
    expect(screen.queryByText(/Jordu est encore en construction/)).toBeNull()
  })
})
