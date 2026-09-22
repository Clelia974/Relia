import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { NewWeddingPage } from '@/pages/mariages/NewWeddingPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

const useWeddingLimitMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/payment/useWeddingLimit', () => ({ useWeddingLimit: useWeddingLimitMock }))

function renderAt(path = '/mariages/nouveau') {
  const router = createMemoryRouter(
    [
      { path: '/mariages/nouveau', element: <NewWeddingPage /> },
      { path: '/mariages', element: <p>Page Mariages</p> },
      { path: '/paiement', element: <p>Page Abonnement</p> },
    ],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

beforeEach(() => useWorkspaceStore.setState({ workspace: createEmptyWorkspace() }))

describe('NewWeddingPage — filet de sécurité limite Gratuit', () => {
  it('sous la limite : affiche le formulaire normalement', () => {
    useWeddingLimitMock.mockReturnValue({ canCreate: true, limitReached: false, weddingCount: 1, limit: 3 })

    renderAt()

    expect(screen.getByRole('heading', { name: 'Créer un mariage' })).toBeInTheDocument()
  })

  it('limite atteinte (accès direct par URL) : bloque avant le formulaire, jamais brutal (échappatoires proposées)', () => {
    useWeddingLimitMock.mockReturnValue({ canCreate: false, limitReached: true, weddingCount: 3, limit: 3 })

    renderAt()

    expect(screen.getByRole('heading', { name: 'Limite de la version Gratuite atteinte' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Nom du couple/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour aux mariages' })).toHaveAttribute('href', '/mariages')
    expect(screen.getByRole('link', { name: 'Passer au Pro' })).toHaveAttribute('href', '/paiement')
  })
})
