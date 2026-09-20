import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProposalBuilderPage } from '@/pages/mariages/ProposalBuilderPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { ProposalStatus, Wedding } from '@/types/entities'

afterEach(cleanup)

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
})

function seedWeddingAndProposal(status: ProposalStatus) {
  const weddingId = useWorkspaceStore.getState().createWedding({
    coupleName: 'Camille & Antoine',
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount: 5000,
    clientBudget: 5000,
    status: 'signe',
  })
  const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
  const proposalId = useWorkspaceStore.getState().createProposal({
    weddingId,
    template: 'silver',
    title: 'Proposition Test',
    lineItems: [
      { id: 'l1', description: 'Service', category: 'Autre', quantity: 1, unitPrice: 1000, total: 1000, included: true, optional: false },
    ],
    subtotal: 1000,
    vatMode: 'franchise_en_base',
    taxAmount: 0,
    total: 1000,
    depositAmount: 0,
    balanceAmount: 1000,
    status,
  })
  return { wedding, proposalId }
}

function renderProposal(wedding: Wedding, proposalId: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/mariages/:weddingId',
        element: <Outlet context={{ wedding }} />,
        children: [{ path: 'documents/propositions/:proposalId', element: <ProposalBuilderPage /> }],
      },
    ],
    { initialEntries: [`/mariages/${wedding.id}/documents/propositions/${proposalId}`] },
  )
  return render(
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>,
  )
}

describe('ProposalBuilderPage — workflow brouillon / finalisé (Phase 2)', () => {
  it("un brouillon s'ouvre en mode Éditeur, formulaire visible", () => {
    const { wedding, proposalId } = seedWeddingAndProposal('brouillon')
    renderProposal(wedding, proposalId)

    expect(screen.getByLabelText('Titre de la proposition')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Éditeur' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aperçu' })).toBeInTheDocument()
  })

  it("une proposition approuvée s'ouvre directement en aperçu, sans champ de formulaire ni bascule Éditeur/Aperçu", () => {
    const { wedding, proposalId } = seedWeddingAndProposal('approuvee')
    renderProposal(wedding, proposalId)

    expect(screen.queryByLabelText('Titre de la proposition')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Éditeur' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aperçu' })).not.toBeInTheDocument()
  })

  it("l'impression reste disponible directement pour une proposition en lecture seule", () => {
    const { wedding, proposalId } = seedWeddingAndProposal('rejetee')
    renderProposal(wedding, proposalId)

    expect(screen.getByRole('button', { name: /Imprimer/ })).toBeInTheDocument()
  })

  it.each(['approuvee', 'rejetee', 'expiree'] as const)(
    'le sélecteur de statut est désactivé pour une proposition à statut final (%s)',
    (status) => {
      const { wedding, proposalId } = seedWeddingAndProposal(status)
      renderProposal(wedding, proposalId)

      expect(screen.getByRole('combobox', { name: 'Statut verrouillé' })).toBeDisabled()
    },
  )

  it('le sélecteur de statut reste actif pour une proposition envoyée (non finale)', () => {
    const { wedding, proposalId } = seedWeddingAndProposal('envoyee')
    renderProposal(wedding, proposalId)

    expect(screen.getByRole('combobox', { name: 'Statut de la proposition' })).not.toBeDisabled()
  })

  it("un brouillon garde la bascule Imprimer indirecte (prévisualiser d'abord)", () => {
    const { wedding, proposalId } = seedWeddingAndProposal('brouillon')
    renderProposal(wedding, proposalId)

    expect(screen.getByRole('button', { name: /Prévisualiser avant impression/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Imprimer \/ Enregistrer/ })).not.toBeInTheDocument()
  })

  it('« Créer une nouvelle version » sur une proposition approuvée crée une copie indépendante en brouillon', () => {
    const { wedding, proposalId } = seedWeddingAndProposal('approuvee')
    renderProposal(wedding, proposalId)

    fireEvent.click(screen.getByRole('button', { name: 'Créer une nouvelle version' }))

    const proposals = useWorkspaceStore.getState().workspace.proposals
    expect(proposals).toHaveLength(2)
    const original = proposals.find((p) => p.id === proposalId)!
    const copy = proposals.find((p) => p.id !== proposalId)!
    expect(copy.status).toBe('brouillon')
    expect(copy.title).toContain('copie')
    // L'original reste inchangé — jamais écrasé par la nouvelle version.
    expect(original.status).toBe('approuvee')
    expect(original.title).toBe('Proposition Test')
  })

  it('rafraîchir (remonter) la page préserve le statut et donc le mode lecture seule', () => {
    const { wedding, proposalId } = seedWeddingAndProposal('approuvee')
    const { unmount } = renderProposal(wedding, proposalId)
    unmount()
    renderProposal(wedding, proposalId)

    expect(screen.queryByLabelText('Titre de la proposition')).not.toBeInTheDocument()
  })
})
