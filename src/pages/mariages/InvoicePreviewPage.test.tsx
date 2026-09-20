import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { InvoicePreviewPage } from '@/pages/mariages/InvoicePreviewPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { InvoiceStatus, Wedding } from '@/types/entities'

afterEach(cleanup)

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
})

function seedWeddingAndInvoice(status: InvoiceStatus) {
  const weddingId = useWorkspaceStore.getState().createWedding({
    coupleName: 'Camille & Antoine',
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount: 5000,
    clientBudget: 5000,
    status: 'signe',
  })
  const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)!
  const invoiceId = useWorkspaceStore.getState().createInvoicePreview({
    weddingId,
    invoiceNumber: 'FACT-1',
    date: '2026-06-06T00:00:00.000Z',
    clientName: 'Camille & Antoine',
    lineItems: [
      { id: 'l1', description: 'Service', category: 'Autre', quantity: 1, unitPrice: 1000, total: 1000, included: true, optional: false },
    ],
    subtotal: 1000,
    vatMode: 'franchise_en_base',
    taxAmount: 0,
    total: 1000,
  })
  if (status === 'finalisee') {
    useWorkspaceStore.getState().updateInvoiceStatus(invoiceId, 'finalisee')
  }
  return { wedding, invoiceId }
}

function renderInvoice(wedding: Wedding, invoiceId: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/mariages/:weddingId',
        element: <Outlet context={{ wedding }} />,
        children: [{ path: 'documents/factures/:invoiceId', element: <InvoicePreviewPage /> }],
      },
    ],
    { initialEntries: [`/mariages/${wedding.id}/documents/factures/${invoiceId}`] },
  )
  return render(
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>,
  )
}

describe('InvoicePreviewPage — verrou brouillon / finalisée (Phase 2b)', () => {
  it('un brouillon s\'ouvre en mode Éditeur, formulaire visible, action Finaliser proposée', () => {
    const { wedding, invoiceId } = seedWeddingAndInvoice('brouillon')
    renderInvoice(wedding, invoiceId)

    expect(screen.getByLabelText('Numéro de facture')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Éditeur' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Finaliser/ })).toBeInTheDocument()
  })

  it("une facture finalisée s'ouvre directement en aperçu, sans champ de formulaire ni bascule Éditeur/Aperçu", () => {
    const { wedding, invoiceId } = seedWeddingAndInvoice('finalisee')
    renderInvoice(wedding, invoiceId)

    expect(screen.queryByLabelText('Numéro de facture')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Éditeur' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Finaliser/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Imprimer/ })).toBeInTheDocument()
  })

  it('finaliser une facture brouillon la verrouille (après confirmation)', () => {
    const { wedding, invoiceId } = seedWeddingAndInvoice('brouillon')
    renderInvoice(wedding, invoiceId)

    fireEvent.click(screen.getByRole('button', { name: /Finaliser/ }))
    const dialog = screen.getByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Finaliser' }))

    const invoice = useWorkspaceStore.getState().workspace.invoices.find((inv) => inv.id === invoiceId)
    expect(invoice?.status).toBe('finalisee')
    expect(invoice?.finalizedAt).toBeDefined()
  })

  it('« Créer une nouvelle version » sur une facture finalisée crée une copie indépendante en brouillon', () => {
    const { wedding, invoiceId } = seedWeddingAndInvoice('finalisee')
    renderInvoice(wedding, invoiceId)

    fireEvent.click(screen.getByRole('button', { name: 'Créer une nouvelle version' }))

    const invoices = useWorkspaceStore.getState().workspace.invoices
    expect(invoices).toHaveLength(2)
    const original = invoices.find((inv) => inv.id === invoiceId)!
    const copy = invoices.find((inv) => inv.id !== invoiceId)!
    expect(copy.status).toBe('brouillon')
    expect(copy.finalizedAt).toBeUndefined()
    expect(original.status).toBe('finalisee')
  })

  it('rafraîchir (remonter) la page préserve le statut finalisé', () => {
    const { wedding, invoiceId } = seedWeddingAndInvoice('finalisee')
    const { unmount } = renderInvoice(wedding, invoiceId)
    unmount()
    renderInvoice(wedding, invoiceId)

    expect(screen.queryByLabelText('Numéro de facture')).not.toBeInTheDocument()
  })
})
