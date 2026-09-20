import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

const state = () => useWorkspaceStore.getState()
const year = new Date().getFullYear()

function newProposal(weddingId: string) {
  return state().createProposal({
    weddingId,
    template: 'gold',
    title: 'Proposition',
    lineItems: [],
    subtotal: 0,
    vatMode: 'franchise_en_base',
    taxAmount: 0,
    total: 0,
    depositAmount: 0,
    balanceAmount: 0,
  })
}

function newInvoice(weddingId: string) {
  return state().createInvoicePreview({
    weddingId,
    date: '2026-06-06T00:00:00.000Z',
    lineItems: [],
    subtotal: 0,
    vatMode: 'franchise_en_base',
    taxAmount: 0,
    total: 0,
  })
}

const proposalNumber = (id: string) => state().workspace.proposals.find((p) => p.id === id)!.proposalNumber
const invoiceNumber = (id: string) => state().workspace.invoices.find((i) => i.id === id)!.invoiceNumber

describe('numérotation automatique des devis et factures', () => {
  let weddingA: string
  let weddingB: string

  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    const base = { date: '2026-06-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe' as const }
    weddingA = state().createWedding({ ...base, coupleName: 'A' })
    weddingB = state().createWedding({ ...base, coupleName: 'B' })
  })

  it('un devis reçoit un numéro DEV-AAAA-NNNN sans saisie', () => {
    expect(proposalNumber(newProposal(weddingA))).toBe(`DEV-${year}-0001`)
  })

  it('une facture reçoit un numéro FACT-AAAA-NNNN sans saisie', () => {
    expect(invoiceNumber(newInvoice(weddingA))).toBe(`FACT-${year}-0001`)
  })

  it('la séquence est continue et commune à tous les mariages', () => {
    const numbers = [newProposal(weddingA), newProposal(weddingB), newProposal(weddingA)].map(proposalNumber)
    expect(numbers).toEqual([`DEV-${year}-0001`, `DEV-${year}-0002`, `DEV-${year}-0003`])
  })

  it('les devis et les factures ont des séquences indépendantes', () => {
    newProposal(weddingA)
    newProposal(weddingA)
    expect(invoiceNumber(newInvoice(weddingA))).toBe(`FACT-${year}-0001`)
  })

  it('un numéro supprimé n\'est jamais réutilisé', () => {
    const first = newProposal(weddingA)
    newProposal(weddingA)
    state().deleteProposal(first)
    expect(proposalNumber(newProposal(weddingA))).toBe(`DEV-${year}-0003`)
  })

  it('dupliquer un devis ou une facture attribue un nouveau numéro, sans toucher à l\'original', () => {
    const proposal = newProposal(weddingA)
    const copy = state().duplicateProposal(proposal)!
    expect(proposalNumber(proposal)).toBe(`DEV-${year}-0001`)
    expect(proposalNumber(copy)).toBe(`DEV-${year}-0002`)

    const invoice = newInvoice(weddingA)
    const invoiceCopy = state().duplicateInvoicePreview(invoice)!
    expect(invoiceNumber(invoice)).toBe(`FACT-${year}-0001`)
    expect(invoiceNumber(invoiceCopy)).toBe(`FACT-${year}-0002`)
  })

  it('le numéro ne peut pas être modifié après coup', () => {
    const proposal = newProposal(weddingA)
    const invoice = newInvoice(weddingA)
    state().updateProposal(proposal, { proposalNumber: 'DEV-TRUCHE', title: 'Nouveau titre' })
    state().updateInvoicePreview(invoice, { invoiceNumber: 'FACT-TRUCHE', clientName: 'Client' })
    expect(proposalNumber(proposal)).toBe(`DEV-${year}-0001`)
    expect(invoiceNumber(invoice)).toBe(`FACT-${year}-0001`)
    expect(state().workspace.proposals[0].title).toBe('Nouveau titre')
    expect(state().workspace.invoices[0].clientName).toBe('Client')
  })

  it('deux documents créés ne partagent jamais le même numéro', () => {
    const invoices = Array.from({ length: 5 }, () => invoiceNumber(newInvoice(weddingA)))
    expect(new Set(invoices).size).toBe(5)
  })
})
