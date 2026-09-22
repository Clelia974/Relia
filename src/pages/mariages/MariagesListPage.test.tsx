import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MariagesListPage } from '@/pages/mariages/MariagesListPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

const useWeddingLimitMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/payment/useWeddingLimit', () => ({ useWeddingLimit: useWeddingLimitMock }))

function seedWedding() {
  return useWorkspaceStore.getState().createWedding({
    coupleName: 'Camille & Antoine',
    date: '2026-10-10T00:00:00.000Z',
    venue: '',
    soldAmount: 0,
    clientBudget: 0,
    status: 'signe',
  })
}

function renderAt(path = '/mariages') {
  const router = createMemoryRouter(
    [
      { path: '/mariages', element: <MariagesListPage /> },
      { path: '/mariages/nouveau', element: <p>Page Créer un mariage</p> },
      { path: '/paiement', element: <p>Page Abonnement</p> },
    ],
    { initialEntries: [path] },
  )
  return render(
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>,
  )
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
})

describe('MariagesListPage — limite Gratuit', () => {
  it('sous la limite : le clic navigue directement vers le formulaire', () => {
    seedWedding()
    useWeddingLimitMock.mockReturnValue({ canCreate: true, limitReached: false, weddingCount: 1, limit: 3 })

    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Créer un mariage' }))

    expect(screen.getByText('Page Créer un mariage')).toBeInTheDocument()
  })

  it('limite atteinte : le clic ouvre la boîte de dialogue au lieu de naviguer', () => {
    seedWedding()
    useWeddingLimitMock.mockReturnValue({ canCreate: false, limitReached: true, weddingCount: 3, limit: 3 })

    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Créer un mariage' }))

    expect(screen.getByText('Limite de la version Gratuite atteinte')).toBeInTheDocument()
    expect(screen.queryByText('Page Créer un mariage')).not.toBeInTheDocument()
  })

  it('limite atteinte : le message "X / 3 mariages" est visible dans l’en-tête', () => {
    seedWedding()
    useWeddingLimitMock.mockReturnValue({ canCreate: false, limitReached: true, weddingCount: 3, limit: 3 })

    renderAt()

    expect(screen.getByText(/3 \/ 3 mariages/)).toBeInTheDocument()
  })

  it('la boîte de dialogue mène vers /paiement', () => {
    seedWedding()
    useWeddingLimitMock.mockReturnValue({ canCreate: false, limitReached: true, weddingCount: 3, limit: 3 })

    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Créer un mariage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Passer au Pro' }))

    expect(screen.getByText('Page Abonnement')).toBeInTheDocument()
  })
})
