import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

const markLeadStatusMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/leads/leadsApi', () => ({ markLeadStatus: markLeadStatusMock }))

const relanceDevisMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/proposals/useRelanceDevis', () => ({ useRelanceDevis: () => ({ relanceDevis: relanceDevisMock, isLoading: false }) }))

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
    user_id: 'u1',
    client_name: 'Sophie',
    client_phone: null,
    client_email: null,
    event_type: 'mariage',
    event_date: '2027-06-12',
    venue: 'Domaine des Roses',
    guest_count: 80,
    budget_estimate: 5000,
    message: null,
    source: 'instagram',
    status: 'nouveau',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function renderPage(leads: Lead[]) {
  useLeadsInboxMock.mockReturnValue({ leads, isLoading: false, error: null, refresh: vi.fn() })
  const router = createMemoryRouter(
    [
      { path: '/mariages/demandes', element: <LeadsInboxPage /> },
      { path: '/mariages/demandes/:leadId', element: <p>Fiche de la demande</p> },
      { path: '/mariages/demandes/:leadId/devis/:proposalId', element: <p>Éditeur de devis</p> },
      { path: '/mariages/:weddingId', element: <p>Fiche mariage</p> },
    ],
    { initialEntries: ['/mariages/demandes'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  useAuthMock.mockReturnValue({ user: { id: 'u1', email: 'u1@example.com' } })
  markLeadStatusMock.mockReset().mockResolvedValue(undefined)
  relanceDevisMock.mockReset().mockResolvedValue(true)
})

describe('LeadsInboxPage — pipeline (reste "leads" jusqu’à la signature)', () => {
  it('un lead "nouveau" propose "Marquer comme répondu" ou directement "Créer un devis" (et Ignorer)', async () => {
    renderPage([makeLead({ status: 'nouveau' })])

    expect(screen.getByRole('button', { name: 'Créer un devis' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Marquer comme répondu' }))

    await waitFor(() => expect(markLeadStatusMock).toHaveBeenCalledWith('lead-1', 'repondu'))
    expect(screen.queryByRole('button', { name: 'Marquer comme signé' })).toBeNull()
  })

  it('"Créer un devis" ouvre l’éditeur de devis de la demande, sans changer son statut ni créer de mariage', async () => {
    const router = renderPage([makeLead({ status: 'repondu' })])

    fireEvent.click(screen.getByRole('button', { name: 'Créer un devis' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/mariages/demandes/lead-1/devis/nouveau'))
    expect(markLeadStatusMock).not.toHaveBeenCalled()
    expect(useWorkspaceStore.getState().workspace.weddings).toHaveLength(0)
  })

  it('"Relancer" sur un devis envoyé remplace la tâche de relance existante par une nouvelle échéance', async () => {
    useWorkspaceStore.getState().addTask({ title: 'Relancer le devis — Sophie', leadId: 'lead-1' })
    renderPage([makeLead({ status: 'devis_envoye', client_email: null })])

    fireEvent.click(screen.getByRole('button', { name: 'Relancer' }))

    await waitFor(() => {
      const tasks = useWorkspaceStore.getState().workspace.tasks.filter((t) => t.leadId === 'lead-1')
      expect(tasks).toHaveLength(1)
      expect(tasks[0].dueDate).toBeTruthy()
    })
    // Pas d'email client sur ce lead : uniquement la note interne, jamais d'appel à l'envoi.
    expect(relanceDevisMock).not.toHaveBeenCalled()
  })

  it('"Relancer" envoie aussi un email de rappel quand le devis a déjà un lien de partage et que le lead a un email', async () => {
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
      status: 'envoyee',
    })
    const proposalId = useWorkspaceStore.getState().workspace.proposals[0].id
    useWorkspaceStore.getState().setProposalShareId(proposalId, 'share-abc')
    renderPage([makeLead({ status: 'devis_envoye', client_email: 'sophie@example.com' })])

    fireEvent.click(screen.getByRole('button', { name: 'Relancer' }))

    // Devis déjà partagé + email connu : un aperçu s'ouvre d'abord, jamais un envoi direct au clic.
    const relanceButtons = await screen.findAllByRole('button', { name: 'Relancer' })
    expect(relanceDevisMock).not.toHaveBeenCalled()
    fireEvent.click(relanceButtons[relanceButtons.length - 1])

    await waitFor(() =>
      expect(relanceDevisMock).toHaveBeenCalledWith(
        expect.objectContaining({ shareId: 'share-abc', clientEmail: 'sophie@example.com' }),
      ),
    )
  })

  it('"Marquer comme signé" crée le mariage avec la checklist, et retire la tâche de relance', async () => {
    useWorkspaceStore.getState().addTask({ title: 'Relancer le devis — Sophie', leadId: 'lead-1' })
    renderPage([makeLead({ status: 'devis_envoye' })])

    fireEvent.click(screen.getByRole('button', { name: 'Marquer comme signé' }))

    await waitFor(() => expect(markLeadStatusMock).toHaveBeenCalledWith('lead-1', 'importe'))
    const state = useWorkspaceStore.getState().workspace
    expect(state.weddings).toHaveLength(1)
    const wedding = state.weddings[0]
    expect(wedding.status).toBe('signe')
    expect(wedding.coupleName).toBe('Sophie')
    expect(wedding.venue).toBe('Domaine des Roses')
    expect(wedding.guestCount).toBe(80)
    // La checklist de démarrage a bien été générée à la signature.
    expect(state.tasks.some((t) => t.weddingId === wedding.id)).toBe(true)
    // La relance créée avant la signature a été retirée.
    expect(state.tasks.some((t) => t.leadId === 'lead-1')).toBe(false)
  })

  it('"Ignorer" écarte la demande', async () => {
    renderPage([makeLead({ status: 'nouveau' })])

    fireEvent.click(screen.getByRole('button', { name: 'Ignorer' }))

    await waitFor(() => expect(markLeadStatusMock).toHaveBeenCalledWith('lead-1', 'ignore'))
  })
})

describe('LeadsInboxPage — ouverture de la fiche détaillée', () => {
  it('cliquer sur le nom du lead ouvre sa fiche détaillée (LeadDetailPage), pour voir toutes ses coordonnées et ses devis', async () => {
    const router = renderPage([makeLead()])

    fireEvent.click(screen.getByRole('button', { name: /Voir la fiche de Sophie/ }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/mariages/demandes/lead-1'))
  })
})

describe('LeadsInboxPage — lien de contact', () => {
  it("construit le lien à partir de l'id de l'utilisatrice connectée", () => {
    renderPage([])

    expect(screen.getByText(/\/lead\/new\/u1$/)).toBeInTheDocument()
  })
})
