import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { LeadsInboxPage } from '@/pages/mariages/LeadsInboxPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Lead } from '@/schemas/lead'

afterEach(cleanup)

const useLeadsInboxMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/leads/useLeadsInbox', () => ({ useLeadsInbox: useLeadsInboxMock }))

const useAuthMock = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/useAuth', () => ({ useAuth: useAuthMock }))

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
    user_id: 'u1',
    client_name: 'Sophie',
    client_phone: null,
    client_email: null,
    event_type: 'mariage',
    event_date: '2027-06-12',
    venue: null,
    guest_count: null,
    budget_estimate: null,
    message: null,
    source: 'instagram',
    status: 'nouveau',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function renderPage() {
  const router = createMemoryRouter([{ path: '/mariages/demandes', element: <LeadsInboxPage /> }], {
    initialEntries: ['/mariages/demandes'],
  })
  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  useAuthMock.mockReturnValue({ user: { id: 'u1', email: 'u1@example.com' } })
})

describe('LeadsInboxPage — relance (V2, sans cron)', () => {
  it("n'affiche pas le badge de relance pour une demande récente", () => {
    useLeadsInboxMock.mockReturnValue({
      leads: [makeLead({ created_at: new Date().toISOString() })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    })

    renderPage()

    expect(screen.queryByText('⏰ À relancer')).not.toBeInTheDocument()
  })

  it('affiche le badge de relance pour une demande reçue il y a plus de 5 jours', () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    useLeadsInboxMock.mockReturnValue({
      leads: [makeLead({ created_at: sixDaysAgo })],
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('⏰ À relancer')).toBeInTheDocument()
  })
})

describe('LeadsInboxPage — lien de contact', () => {
  it("construit le lien à partir de l'id de l'utilisatrice connectée", () => {
    useLeadsInboxMock.mockReturnValue({ leads: [], isLoading: false, error: null, refresh: vi.fn() })

    renderPage()

    expect(screen.getByText(/\/lead\/new\/u1$/)).toBeInTheDocument()
  })
})
