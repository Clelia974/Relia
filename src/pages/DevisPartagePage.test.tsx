import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { DevisPartagePage } from '@/pages/DevisPartagePage'

afterEach(cleanup)

const useDevisPartageMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/proposals/useDevisPartage', () => ({ useDevisPartage: useDevisPartageMock }))

function renderAt(path: string) {
  const router = createMemoryRouter([{ path: '/devis/:shareId', element: <DevisPartagePage /> }], { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('DevisPartagePage — consultation publique d’un devis partagé', () => {
  it('affiche un message de chargement pendant la récupération', () => {
    useDevisPartageMock.mockReturnValue({ snapshot: null, isLoading: true, error: null })
    renderAt('/devis/share-1')

    expect(screen.getByText('Chargement du devis…')).toBeInTheDocument()
  })

  it("affiche une erreur lisible si le lien est introuvable", () => {
    useDevisPartageMock.mockReturnValue({
      snapshot: null,
      isLoading: false,
      error: 'Ce devis est introuvable — le lien est peut-être incorrect.',
    })
    renderAt('/devis/inconnu')

    expect(screen.getByText('Ce devis est introuvable — le lien est peut-être incorrect.')).toBeInTheDocument()
  })

  it('affiche le devis via ProposalDocumentPreview une fois chargé', () => {
    useDevisPartageMock.mockReturnValue({
      snapshot: {
        businessConfig: { id: 'b1', companyName: 'Atelier Fleur', vatStatus: 'non_assujetti', currency: 'EUR' },
        wedding: { coupleName: 'Sophie & Marc', date: '2027-06-12T00:00:00.000Z', venue: 'Domaine des Roses' },
        title: 'Devis mariage',
        proposalNumber: 'P-0001',
        clientName: 'Sophie Martin',
        lineItems: [],
        totals: { subtotal: 0, optionsTotal: 0, taxAmount: 0, total: 0, depositAmount: 0, balanceAmount: 0 },
        vatMode: 'non_assujetti',
      },
      isLoading: false,
      error: null,
    })
    renderAt('/devis/share-1')

    expect(screen.getByText('Devis mariage')).toBeInTheDocument()
    expect(screen.getByText('Atelier Fleur')).toBeInTheDocument()
  })
})
