import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { FacturePartageePage } from '@/pages/FacturePartageePage'

afterEach(cleanup)

const useFacturePartageeMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/invoices/useFacturePartagee', () => ({ useFacturePartagee: useFacturePartageeMock }))

function renderAt(path: string) {
  const router = createMemoryRouter([{ path: '/facture/:shareId', element: <FacturePartageePage /> }], { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('FacturePartageePage — consultation publique d’une facture partagée', () => {
  it('affiche un message de chargement pendant la récupération', () => {
    useFacturePartageeMock.mockReturnValue({ snapshot: null, isLoading: true, error: null })
    renderAt('/facture/share-1')

    expect(screen.getByText('Chargement de la facture…')).toBeInTheDocument()
  })

  it('affiche une erreur lisible si le lien est introuvable', () => {
    useFacturePartageeMock.mockReturnValue({
      snapshot: null,
      isLoading: false,
      error: 'Cette facture est introuvable — le lien est peut-être incorrect.',
    })
    renderAt('/facture/inconnu')

    expect(screen.getByText('Cette facture est introuvable — le lien est peut-être incorrect.')).toBeInTheDocument()
  })

  it('affiche la facture via InvoiceDocumentPreview une fois chargée', () => {
    useFacturePartageeMock.mockReturnValue({
      snapshot: {
        businessConfig: { id: 'b1', companyName: 'Atelier Fleur', vatStatus: 'non_assujetti', currency: 'EUR' },
        wedding: { coupleName: 'Sophie & Marc', date: '2027-06-12T00:00:00.000Z' },
        invoiceNumber: 'FAC-2027-0001',
        date: '2027-06-12T00:00:00.000Z',
        clientName: 'Sophie Martin',
        lineItems: [],
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        vatMode: 'non_assujetti',
      },
      isLoading: false,
      error: null,
    })
    renderAt('/facture/share-1')

    expect(screen.getByText(/FAC-2027-0001/)).toBeInTheDocument()
    expect(screen.getByText('Atelier Fleur')).toBeInTheDocument()
  })
})
