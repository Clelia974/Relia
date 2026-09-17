import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { WeddingSoldServicesTab } from '@/pages/mariages/WeddingSoldServicesTab'
import type { Wedding } from '@/types/entities'

afterEach(cleanup)

function renderWithWedding(wedding: Wedding) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <Outlet context={{ wedding }} />,
      children: [{ index: true, element: <WeddingSoldServicesTab /> }],
    },
  ])
  return render(<RouterProvider router={router} />)
}

function seedWeddingWithApprovedProposal() {
  const weddingId = useWorkspaceStore.getState().createWedding({
    coupleName: 'Test',
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount: 5000,
    clientBudget: 5000,
    status: 'signe',
  })
  const proposalId = useWorkspaceStore.getState().createProposal({
    weddingId,
    template: 'gold',
    title: 'Proposition Gold',
    lineItems: [
      { id: 'li1', description: 'Décoration florale', category: 'Fleuriste', quantity: 1, unitPrice: 800, total: 800, included: true, optional: false },
      { id: 'li2', description: 'DJ soirée', category: 'DJ', quantity: 1, unitPrice: 600, total: 600, included: true, optional: false },
    ],
    subtotal: 1400,
    vatMode: 'ne_sait_pas_encore',
    taxAmount: 0,
    total: 1400,
    depositAmount: 0,
    balanceAmount: 1400,
  })
  useWorkspaceStore.getState().updateProposalStatus(proposalId, 'approuvee')
  return { weddingId, proposalId }
}

describe('WeddingSoldServicesTab', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  })

  it("1. affiche un état vide invitant à approuver une proposition quand aucune n'est approuvée", () => {
    const weddingId = useWorkspaceStore.getState().createWedding({
      coupleName: 'Sans proposition',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 5000,
      clientBudget: 5000,
      status: 'signe',
    })
    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    expect(screen.getByText(/Aucune proposition approuvée/)).toBeInTheDocument()
  })

  it('2. génère les prestations vendues au clic, depuis les lignes incluses', () => {
    const { weddingId } = seedWeddingWithApprovedProposal()
    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: 'Générer les prestations vendues' }))

    expect(screen.getByText('Décoration florale')).toBeInTheDocument()
    expect(screen.getByText('DJ soirée')).toBeInTheDocument()
    expect(useWorkspaceStore.getState().workspace.soldServices).toHaveLength(2)
  })

  it('3. ajoute une prestation manuelle via le formulaire', () => {
    const { weddingId, proposalId } = seedWeddingWithApprovedProposal()
    useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)
    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: /Ajouter une prestation/ }))
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Photobooth' } })
    fireEvent.change(screen.getByLabelText('Prix vendu'), { target: { value: '250' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(screen.getByText('Photobooth')).toBeInTheDocument()
    const soldService = useWorkspaceStore.getState().workspace.soldServices.find((s) => s.title === 'Photobooth')
    expect(soldService?.status).toBe('ajoutee_ulterieurement')
  })

  it('4. crée une tâche de préparation depuis une prestation, une seule fois', () => {
    const { weddingId, proposalId } = seedWeddingWithApprovedProposal()
    useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)
    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    const card = screen.getByText('Décoration florale').closest('[data-slot="card"]') as HTMLElement
    fireEvent.click(within(card).getByRole('button', { name: 'Créer une tâche de préparation' }))

    expect(within(card).getByText('Tâche de préparation créée')).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Créer une tâche de préparation' })).not.toBeInTheDocument()
    expect(useWorkspaceStore.getState().workspace.tasks).toHaveLength(1)
  })

  it('5. supprime une prestation après confirmation', () => {
    const { weddingId, proposalId } = seedWeddingWithApprovedProposal()
    useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)
    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Décoration florale' }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))

    expect(screen.queryByText('Décoration florale')).not.toBeInTheDocument()
    expect(useWorkspaceStore.getState().workspace.soldServices.find((s) => s.title === 'Décoration florale')).toBeUndefined()
  })
})
