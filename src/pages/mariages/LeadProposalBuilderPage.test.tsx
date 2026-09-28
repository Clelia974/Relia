import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { LeadProposalBuilderPage } from '@/pages/mariages/LeadProposalBuilderPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Lead } from '@/schemas/lead'

afterEach(cleanup)

const useLeadMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/leads/useLead', () => ({ useLead: useLeadMock }))

const markLeadStatusMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/leads/leadsApi', () => ({ markLeadStatus: markLeadStatusMock }))

const shareDevisMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/proposals/useShareDevis', () => ({ useShareDevis: () => ({ shareDevis: shareDevisMock }) }))

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
    status: 'devis_envoye',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function renderPage(proposalId: string) {
  const router = createMemoryRouter(
    [{ path: '/mariages/demandes/:leadId/devis/:proposalId', element: <LeadProposalBuilderPage /> }],
    { initialEntries: [`/mariages/demandes/lead-1/devis/${proposalId}`] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  markLeadStatusMock.mockReset().mockResolvedValue(undefined)
  shareDevisMock.mockReset().mockResolvedValue('share-abc')
})

describe('LeadProposalBuilderPage — lien de partage (avec ou sans email client)', () => {
  it('génère et affiche le lien même sans email client, pour un envoi manuel (WhatsApp/SMS)', async () => {
    useLeadMock.mockReturnValue({ lead: makeLead({ client_email: null }), isLoading: false, error: null })
    const proposalId = useWorkspaceStore.getState().createProposal({
      leadId: 'lead-1',
      template: 'silver',
      title: 'Devis Sophie',
      lineItems: [
        { id: 'l1', description: 'Service', category: 'Autre', quantity: 1, unitPrice: 1000, total: 1000, included: true, optional: false },
      ],
      subtotal: 1000,
      vatMode: 'franchise_en_base',
      taxAmount: 0,
      total: 1000,
      depositAmount: 0,
      balanceAmount: 1000,
      status: 'brouillon',
    })
    renderPage(proposalId)

    fireEvent.click(screen.getByRole('button', { name: 'Marquer comme envoyé' }))

    await waitFor(() => expect(shareDevisMock).toHaveBeenCalledWith(expect.objectContaining({ clientEmail: undefined })))
    await waitFor(() => expect(screen.getByText(/\/devis\/share-abc$/)).toBeInTheDocument())
    expect(useWorkspaceStore.getState().workspace.proposals.find((p) => p.id === proposalId)?.shareId).toBe('share-abc')
  })

  it('transmet l’email client à useShareDevis quand il est renseigné', async () => {
    useLeadMock.mockReturnValue({ lead: makeLead({ client_email: 'sophie@example.com' }), isLoading: false, error: null })
    const proposalId = useWorkspaceStore.getState().createProposal({
      leadId: 'lead-1',
      template: 'silver',
      title: 'Devis Sophie',
      lineItems: [
        { id: 'l1', description: 'Service', category: 'Autre', quantity: 1, unitPrice: 1000, total: 1000, included: true, optional: false },
      ],
      subtotal: 1000,
      vatMode: 'franchise_en_base',
      taxAmount: 0,
      total: 1000,
      depositAmount: 0,
      balanceAmount: 1000,
      status: 'brouillon',
    })
    renderPage(proposalId)

    fireEvent.click(screen.getByRole('button', { name: 'Marquer comme envoyé' }))

    await waitFor(() =>
      expect(shareDevisMock).toHaveBeenCalledWith(expect.objectContaining({ clientEmail: 'sophie@example.com' })),
    )
    await waitFor(() => expect(markLeadStatusMock).toHaveBeenCalledWith('lead-1', 'devis_envoye'))
  })
})
