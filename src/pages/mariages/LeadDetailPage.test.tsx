import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { LeadDetailPage } from '@/pages/mariages/LeadDetailPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Lead } from '@/schemas/lead'

afterEach(cleanup)

const useLeadMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/leads/useLead', () => ({ useLead: useLeadMock }))

const markLeadStatusMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/leads/leadsApi', () => ({ markLeadStatus: markLeadStatusMock }))

const relanceDevisMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/proposals/useRelanceDevis', () => ({ useRelanceDevis: () => ({ relanceDevis: relanceDevisMock, isLoading: false }) }))

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
    user_id: 'u1',
    client_name: 'Sophie',
    client_phone: '0692000000',
    client_email: 'sophie@example.com',
    event_type: 'mariage',
    event_date: '2027-06-12',
    venue: 'Domaine des Roses',
    guest_count: 80,
    budget_estimate: 5000,
    message: 'On cherche une déco champêtre.',
    source: 'instagram',
    status: 'devis_envoye',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function renderPage(lead: Lead | null, { isLoading = false, error = null as string | null } = {}) {
  useLeadMock.mockReturnValue({ lead, isLoading, error, refresh: vi.fn() })
  const router = createMemoryRouter(
    [
      { path: '/mariages/demandes/:leadId', element: <LeadDetailPage /> },
      { path: '/mariages/demandes', element: <p>Demandes reçues</p> },
      { path: '/mariages/demandes/:leadId/devis/:proposalId', element: <p>Éditeur de devis</p> },
      { path: '/mariages/:weddingId', element: <p>Fiche mariage</p> },
    ],
    { initialEntries: ['/mariages/demandes/lead-1'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  markLeadStatusMock.mockReset().mockResolvedValue(undefined)
  relanceDevisMock.mockReset().mockResolvedValue(true)
})

describe('LeadDetailPage — toutes les coordonnées', () => {
  it('affiche téléphone, email, lieu, invités, budget et message', () => {
    renderPage(makeLead())

    expect(screen.getByRole('link', { name: /0692000000/ })).toHaveAttribute('href', 'tel:0692000000')
    expect(screen.getByRole('link', { name: /sophie@example.com/ })).toHaveAttribute('href', 'mailto:sophie@example.com')
    expect(screen.getByText('Domaine des Roses')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText(/5.?000/)).toBeInTheDocument()
    expect(screen.getByText('On cherche une déco champêtre.')).toBeInTheDocument()
  })

  it("affiche aussi le type d'événement, sa date, la source et la date de réception — tout le formulaire, pas juste les coordonnées", () => {
    renderPage(makeLead())

    expect(screen.getByText('Mariage')).toBeInTheDocument()
    expect(screen.getByText('12/06/2027')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
    expect(screen.getByText(/Demande reçue le/)).toBeInTheDocument()
  })

  it("affiche un message d'introuvable quand la demande n'existe pas", () => {
    renderPage(null, { error: 'Introuvable' })

    expect(screen.getByText('Demande introuvable')).toBeInTheDocument()
  })
})

describe('LeadDetailPage — devis créés', () => {
  it("affiche 'Aucun devis créé' quand la demande n'a aucun devis", () => {
    renderPage(makeLead())

    expect(screen.getByText("Aucun devis créé pour l'instant.")).toBeInTheDocument()
  })

  it('liste les devis de la demande avec statut, total, et lien de partage copiable', () => {
    useWorkspaceStore.getState().createProposal({
      leadId: 'lead-1',
      template: 'silver',
      title: 'Devis Sophie',
      lineItems: [],
      subtotal: 1400,
      vatMode: 'franchise_en_base',
      taxAmount: 0,
      total: 1400,
      depositAmount: 0,
      balanceAmount: 1400,
      status: 'envoyee',
    })
    const proposalId = useWorkspaceStore.getState().workspace.proposals[0].id
    useWorkspaceStore.getState().setProposalShareId(proposalId, 'share-abc')

    renderPage(makeLead())

    expect(screen.getByText('Devis Sophie')).toBeInTheDocument()
    expect(screen.getByText(/1\s?400/)).toBeInTheDocument()
    expect(screen.getByText(/\/devis\/share-abc$/)).toBeInTheDocument()
  })

  it('"Ouvrir" un devis navigue vers son éditeur', () => {
    useWorkspaceStore.getState().createProposal({
      leadId: 'lead-1',
      template: 'silver',
      title: 'Devis Sophie',
      lineItems: [],
      subtotal: 0,
      vatMode: 'franchise_en_base',
      taxAmount: 0,
      total: 0,
      depositAmount: 0,
      balanceAmount: 0,
      status: 'brouillon',
    })
    const proposalId = useWorkspaceStore.getState().workspace.proposals[0].id

    const router = renderPage(makeLead())
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))

    expect(router.state.location.pathname).toBe(`/mariages/demandes/lead-1/devis/${proposalId}`)
  })
})

describe('LeadDetailPage — actions', () => {
  it('"Marquer comme signé" crée le mariage et redirige vers sa fiche', async () => {
    const router = renderPage(makeLead({ status: 'devis_envoye' }))

    fireEvent.click(screen.getByRole('button', { name: 'Marquer comme signé' }))

    await waitFor(() => expect(useWorkspaceStore.getState().workspace.weddings).toHaveLength(1))
    const wedding = useWorkspaceStore.getState().workspace.weddings[0]
    await waitFor(() => expect(router.state.location.pathname).toBe(`/mariages/${wedding.id}`))
  })
})
