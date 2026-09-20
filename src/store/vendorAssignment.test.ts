import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { getWeddingAssignments } from '@/features/vendors/assignments'
import { useWorkspaceStore } from '@/store/workspaceStore'

/** Isolation entre la fiche catalogue (Vendor) et les affectations (VendorWeddingLink), et entre mariages. */
describe('affectations prestataire — isolation', () => {
  let w1: string
  let w2: string
  let vendorId: string

  const state = () => useWorkspaceStore.getState().workspace
  const link = (weddingId: string) => state().vendorWeddingLinks.find((l) => l.vendorId === vendorId && l.weddingId === weddingId)!

  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    const base = { date: '2026-06-06T00:00:00.000Z', venue: '', soldAmount: 5000, clientBudget: 5000, status: 'signe' as const }
    w1 = useWorkspaceStore.getState().createWedding({ ...base, coupleName: 'A' })
    w2 = useWorkspaceStore.getState().createWedding({ ...base, coupleName: 'B' })
    vendorId = useWorkspaceStore.getState().addVendor({ name: 'DJ', category: 'DJ', phone: '0600', weddingIds: [w1] })
    useWorkspaceStore.getState().addVendorToWedding(vendorId, w2)
  })

  it('prestataire lié à un seul mariage : une affectation par défaut est créée', () => {
    const id = useWorkspaceStore.getState().addVendor({ name: 'Solo', category: 'Autre', weddingIds: [w1], status: 'contacte', arrivalTime: '09:00' })
    const l = state().vendorWeddingLinks.find((x) => x.vendorId === id)
    expect(l).toMatchObject({ weddingId: w1, status: 'contacte', arrivalTime: '09:00' })
  })

  it('prestataire lié à aucun mariage : aucune affectation, fiche conservée', () => {
    const id = useWorkspaceStore.getState().addVendor({ name: 'Catalogue', category: 'Autre' })
    expect(state().vendors.some((v) => v.id === id)).toBe(true)
    expect(state().vendorWeddingLinks.some((l) => l.vendorId === id)).toBe(false)
  })

  it('prestataire lié à plusieurs mariages : deux affectations distinctes', () => {
    expect(state().vendors.find((v) => v.id === vendorId)?.weddingIds).toEqual([w1, w2])
    expect(state().vendorWeddingLinks.filter((l) => l.vendorId === vendorId)).toHaveLength(2)
  })

  it('addVendorToWedding est idempotent', () => {
    useWorkspaceStore.getState().addVendorToWedding(vendorId, w2)
    expect(state().vendorWeddingLinks.filter((l) => l.vendorId === vendorId)).toHaveLength(2)
    expect(state().vendors.find((v) => v.id === vendorId)?.weddingIds).toEqual([w1, w2])
  })

  it('confirmer pour le mariage A ne change pas le mariage B', () => {
    useWorkspaceStore.getState().markVendorConfirmed(vendorId, w1)
    expect(link(w1).status).toBe('confirme')
    expect(link(w2).status).toBe('a_contacter')
  })

  it('statut, horaire et coûts différents par mariage', () => {
    const s = useWorkspaceStore.getState()
    s.updateVendorAssignment(vendorId, w1, { status: 'confirme', arrivalTime: '10:00', estimatedCost: 1000, actualCost: 1100 })
    s.updateVendorAssignment(vendorId, w2, { status: 'devis_recu', arrivalTime: '18:30', estimatedCost: 2000 })
    expect(link(w1)).toMatchObject({ status: 'confirme', arrivalTime: '10:00', estimatedCost: 1000, actualCost: 1100 })
    expect(link(w2)).toMatchObject({ status: 'devis_recu', arrivalTime: '18:30', estimatedCost: 2000 })
    expect(link(w2).actualCost).toBeUndefined()
  })

  it('modifier nom/téléphone/email global laisse les affectations intactes', () => {
    const s = useWorkspaceStore.getState()
    s.updateVendorAssignment(vendorId, w1, { status: 'confirme', arrivalTime: '10:00', estimatedCost: 1000, notes: 'Cour' })
    const before = JSON.stringify(state().vendorWeddingLinks)
    s.updateVendor(vendorId, { name: 'DJ Renommé', phone: '0611', email: 'dj@ex.fr' })
    expect(JSON.stringify(state().vendorWeddingLinks)).toBe(before)
    expect(state().vendors.find((v) => v.id === vendorId)).toMatchObject({ name: 'DJ Renommé', phone: '0611', email: 'dj@ex.fr' })
  })

  it("modifier une affectation laisse la fiche globale et l'autre affectation intactes", () => {
    const s = useWorkspaceStore.getState()
    const vendorBefore = JSON.stringify(state().vendors.find((v) => v.id === vendorId))
    const otherBefore = JSON.stringify(link(w2))
    s.updateVendorAssignment(vendorId, w1, { status: 'acompte_paye', arrivalTime: '11:00', notes: 'X', estimatedCost: 500 })
    expect(JSON.stringify(state().vendors.find((v) => v.id === vendorId))).toBe(vendorBefore)
    expect(JSON.stringify(link(w2))).toBe(otherBefore)
  })

  it('modifier un coût efface needsCostReview de ce lien seulement', () => {
    useWorkspaceStore.setState((st) => ({
      workspace: {
        ...st.workspace,
        vendorWeddingLinks: st.workspace.vendorWeddingLinks.map((l) => ({ ...l, needsCostReview: true, estimatedCost: 100 })),
      },
    }))
    useWorkspaceStore.getState().updateVendorAssignment(vendorId, w1, { estimatedCost: 100 })
    expect(link(w1).needsCostReview).toBeUndefined()
    expect(link(w2).needsCostReview).toBe(true)
  })

  it('updateVendorAssignment est sans effet pour un mariage non lié', () => {
    const w3 = useWorkspaceStore.getState().createWedding({ coupleName: 'C', date: '2026-08-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe' })
    useWorkspaceStore.getState().updateVendorAssignment(vendorId, w3, { status: 'confirme' })
    expect(state().vendorWeddingLinks.some((l) => l.weddingId === w3)).toBe(false)
  })

  it("retirer d'un mariage conserve l'autre affectation", () => {
    useWorkspaceStore.getState().updateVendorAssignment(vendorId, w2, { status: 'confirme', estimatedCost: 700 })
    useWorkspaceStore.getState().removeVendorFromWedding(vendorId, w1)
    expect(state().vendorWeddingLinks.find((l) => l.weddingId === w1 && l.vendorId === vendorId)).toBeUndefined()
    expect(link(w2)).toMatchObject({ status: 'confirme', estimatedCost: 700 })
    expect(state().vendors.find((v) => v.id === vendorId)?.weddingIds).toEqual([w2])
  })

  it('getWeddingAssignments retombe sur une affectation par défaut si le lien manque', () => {
    useWorkspaceStore.setState((st) => ({ workspace: { ...st.workspace, vendorWeddingLinks: [] } }))
    const [a] = getWeddingAssignments(state().vendors, state().vendorWeddingLinks, w1)
    expect(a.link.status).toBe('a_contacter')
  })
})
