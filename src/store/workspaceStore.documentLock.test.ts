import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

/**
 * Verrou d'immutabilité (Phase 2b) : une proposition à statut final
 * (approuvée/rejetée/expirée) ou une facture finalisée ne doit plus jamais
 * être modifiée en place, ni son contenu ni son statut — seule une nouvelle
 * version (dupliquer) permet de corriger. Toute tentative directe sur le
 * store doit être un no-op silencieux (l'UI ne l'expose déjà plus).
 */
describe('workspaceStore — verrou d\'immutabilité Proposal/Invoice (Phase 2b)', () => {
  let weddingId: string

  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    weddingId = useWorkspaceStore.getState().createWedding({
      coupleName: 'Mariage A',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 1000,
      clientBudget: 1000,
      status: 'signe',
    })
  })

  function seedProposal(status: string) {
    return useWorkspaceStore.getState().createProposal({
      weddingId,
      template: 'silver',
      title: 'Proposition',
      lineItems: [],
      subtotal: 0,
      vatMode: 'franchise_en_base',
      taxAmount: 0,
      total: 0,
      depositAmount: 0,
      balanceAmount: 0,
      status: status as never,
    })
  }

  function seedInvoice(status: 'brouillon' | 'finalisee') {
    const id = useWorkspaceStore.getState().createInvoicePreview({
      weddingId,
      date: '2026-06-06T00:00:00.000Z',
      lineItems: [],
      subtotal: 0,
      vatMode: 'franchise_en_base',
      taxAmount: 0,
      total: 0,
    })
    if (status === 'finalisee') {
      useWorkspaceStore.getState().updateInvoiceStatus(id, 'finalisee')
    }
    return id
  }

  it('updateProposal refuse toute modification si le statut est approuvée', () => {
    const id = seedProposal('approuvee')
    useWorkspaceStore.getState().updateProposal(id, { title: 'Titre modifié' })

    const proposal = useWorkspaceStore.getState().workspace.proposals.find((p) => p.id === id)
    expect(proposal?.title).toBe('Proposition')
  })

  it('updateProposalStatus refuse toute régression si le statut actuel est approuvée/rejetée/expirée', () => {
    for (const status of ['approuvee', 'rejetee', 'expiree']) {
      const id = seedProposal(status)
      useWorkspaceStore.getState().updateProposalStatus(id, 'brouillon')
      const proposal = useWorkspaceStore.getState().workspace.proposals.find((p) => p.id === id)
      expect(proposal?.status).toBe(status)
    }
  })

  it('updateProposalStatus reste libre pour envoyée et en attente d\'approbation (non finales)', () => {
    const id = seedProposal('envoyee')
    useWorkspaceStore.getState().updateProposalStatus(id, 'approuvee')
    const proposal = useWorkspaceStore.getState().workspace.proposals.find((p) => p.id === id)
    expect(proposal?.status).toBe('approuvee')
  })

  it('duplicateProposal reste toujours possible et repart en brouillon, sans toucher l\'original', () => {
    const id = seedProposal('approuvee')
    const copyId = useWorkspaceStore.getState().duplicateProposal(id)

    expect(copyId).not.toBeNull()
    const copy = useWorkspaceStore.getState().workspace.proposals.find((p) => p.id === copyId)
    const original = useWorkspaceStore.getState().workspace.proposals.find((p) => p.id === id)
    expect(copy?.status).toBe('brouillon')
    expect(original?.status).toBe('approuvee')
  })

  it('updateInvoicePreview refuse toute modification si la facture est finalisée', () => {
    const id = seedInvoice('finalisee')
    useWorkspaceStore.getState().updateInvoicePreview(id, { total: 9999 })

    const invoice = useWorkspaceStore.getState().workspace.invoices.find((inv) => inv.id === id)
    expect(invoice?.total).toBe(0)
  })

  it('updateInvoiceStatus refuse toute régression si la facture est déjà finalisée', () => {
    const id = seedInvoice('finalisee')
    useWorkspaceStore.getState().updateInvoiceStatus(id, 'brouillon')

    const invoice = useWorkspaceStore.getState().workspace.invoices.find((inv) => inv.id === id)
    expect(invoice?.status).toBe('finalisee')
  })

  it('updateInvoiceStatus vers finalisee renseigne finalizedAt une seule fois', () => {
    const id = seedInvoice('brouillon')
    useWorkspaceStore.getState().updateInvoiceStatus(id, 'finalisee')

    const invoice = useWorkspaceStore.getState().workspace.invoices.find((inv) => inv.id === id)
    expect(invoice?.status).toBe('finalisee')
    expect(invoice?.finalizedAt).toBeDefined()
  })

  it('duplicateInvoicePreview crée une copie indépendante en brouillon, même depuis une facture finalisée', () => {
    const id = seedInvoice('finalisee')
    const copyId = useWorkspaceStore.getState().duplicateInvoicePreview(id)

    expect(copyId).not.toBeNull()
    const copy = useWorkspaceStore.getState().workspace.invoices.find((inv) => inv.id === copyId)
    const original = useWorkspaceStore.getState().workspace.invoices.find((inv) => inv.id === id)
    expect(copy?.status).toBe('brouillon')
    expect(copy?.finalizedAt).toBeUndefined()
    expect(original?.status).toBe('finalisee')
  })
})
