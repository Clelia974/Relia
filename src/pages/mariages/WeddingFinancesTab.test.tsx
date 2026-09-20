import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { WeddingFinancesTab } from '@/pages/mariages/WeddingFinancesTab'
import type { Wedding } from '@/types/entities'

afterEach(cleanup)

/** TooltipProvider est monté globalement dans App.tsx — reproduit ici, sinon tout Tooltip (ex. WeddingBudgetSection) fait planter le rendu. */
function renderWithWedding(wedding: Wedding) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <Outlet context={{ wedding }} />,
      children: [{ index: true, element: <WeddingFinancesTab /> }],
    },
  ])
  return render(
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>,
  )
}

describe('WeddingFinancesTab — badge "Coût à vérifier"', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  })

  it('6. affiche le badge sur la carte du prestataire dont le coût needsCostReview est true', () => {
    const weddingId = useWorkspaceStore.getState().createWedding({
      coupleName: 'Test',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 10000,
      clientBudget: 10000,
      status: 'signe',
    })
    const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Traiteur Migré', category: 'Traiteur', weddingIds: [weddingId] })
    useWorkspaceStore.setState((state) => ({
      workspace: {
        ...state.workspace,
        vendorWeddingLinks: [
          { id: 'l1', vendorId, weddingId, estimatedCost: 3000, needsCostReview: true },
        ],
      },
    }))

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    expect(screen.getAllByText('Coût à vérifier').length).toBeGreaterThan(0)
    expect(screen.getByText(/marge ci-dessus inclut au moins un coût prestataire à vérifier/i)).toBeTruthy()
  })

  it("n'affiche aucun avertissement quand aucun coût n'est à vérifier", () => {
    const weddingId = useWorkspaceStore.getState().createWedding({
      coupleName: 'Test',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 10000,
      clientBudget: 10000,
      status: 'signe',
    })
    const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Traiteur Normal', category: 'Traiteur', weddingIds: [weddingId] })
    useWorkspaceStore.getState().setVendorCostForWedding(vendorId, weddingId, { estimatedCost: 3000 })

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
    renderWithWedding(wedding)

    expect(screen.queryByText('Coût à vérifier')).toBeNull()
  })
})
