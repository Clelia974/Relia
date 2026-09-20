import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

const state = () => useWorkspaceStore.getState()

const contact = { clientAddress: '12 rue des Fleurs, 75011 Paris', clientPhone: '06 12 34 56 78' }

describe('coordonnées du client sur les devis et les factures', () => {
  let weddingId: string

  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    weddingId = state().createWedding({ coupleName: 'A', date: '2026-06-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe' })
  })

  const proposalInput = () => ({
    weddingId,
    template: 'gold' as const,
    title: 'Proposition',
    lineItems: [],
    subtotal: 0,
    vatMode: 'franchise_en_base' as const,
    taxAmount: 0,
    total: 0,
    depositAmount: 0,
    balanceAmount: 0,
  })
  const invoiceInput = () => ({
    weddingId,
    date: '2026-06-06T00:00:00.000Z',
    lineItems: [],
    subtotal: 0,
    vatMode: 'franchise_en_base' as const,
    taxAmount: 0,
    total: 0,
  })

  it('le mariage conserve les coordonnées du client', () => {
    state().updateWedding(weddingId, contact)
    expect(state().workspace.weddings[0]).toMatchObject(contact)
  })

  it('un devis enregistre les coordonnées reçues à la création', () => {
    const id = state().createProposal({ ...proposalInput(), ...contact })
    expect(state().workspace.proposals.find((p) => p.id === id)).toMatchObject(contact)
  })

  it('une facture enregistre les coordonnées reçues à la création', () => {
    const id = state().createInvoicePreview({ ...invoiceInput(), ...contact })
    expect(state().workspace.invoices.find((i) => i.id === id)).toMatchObject(contact)
  })

  it('les coordonnées restent facultatives (anciens documents)', () => {
    const id = state().createProposal(proposalInput())
    const proposal = state().workspace.proposals.find((p) => p.id === id)!
    expect(proposal.clientAddress).toBeUndefined()
    expect(proposal.clientPhone).toBeUndefined()
  })

  it('dupliquer un devis ou une facture reprend les coordonnées', () => {
    const proposalId = state().createProposal({ ...proposalInput(), ...contact })
    const invoiceId = state().createInvoicePreview({ ...invoiceInput(), ...contact })
    const proposalCopy = state().duplicateProposal(proposalId)!
    const invoiceCopy = state().duplicateInvoicePreview(invoiceId)!
    expect(state().workspace.proposals.find((p) => p.id === proposalCopy)).toMatchObject(contact)
    expect(state().workspace.invoices.find((i) => i.id === invoiceCopy)).toMatchObject(contact)
  })

  it("modifier les coordonnées du mariage ne réécrit pas un document déjà créé", () => {
    state().updateWedding(weddingId, contact)
    const id = state().createProposal({ ...proposalInput(), ...contact })
    state().updateWedding(weddingId, { clientAddress: 'Nouvelle adresse', clientPhone: '01 00 00 00 00' })
    expect(state().workspace.proposals.find((p) => p.id === id)).toMatchObject(contact)
  })

  it('un document brouillon peut être corrigé', () => {
    const id = state().createProposal({ ...proposalInput(), ...contact })
    state().updateProposal(id, { clientAddress: 'Adresse corrigée' })
    expect(state().workspace.proposals.find((p) => p.id === id)?.clientAddress).toBe('Adresse corrigée')
  })
})
