import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

/**
 * deleteWedding — nettoyage des prestataires orphelins (Phase 0, correction
 * #2). Un prestataire qui n'était lié qu'au mariage supprimé doit disparaître
 * lui aussi, comme le fait déjà removeVendorFromWedding pour un retrait
 * scopé à un seul mariage.
 */
describe('deleteWedding — prestataires orphelins', () => {
  let w1: string
  let w2: string

  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    w1 = useWorkspaceStore.getState().createWedding({
      coupleName: 'Mariage A',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 5000,
      clientBudget: 5000,
      status: 'signe',
    })
    w2 = useWorkspaceStore.getState().createWedding({
      coupleName: 'Mariage B',
      date: '2026-07-06T00:00:00.000Z',
      venue: '',
      soldAmount: 5000,
      clientBudget: 5000,
      status: 'signe',
    })
  })

  it('1. un prestataire lié uniquement au mariage supprimé est supprimé', () => {
    const vendorId = useWorkspaceStore.getState().addVendor({
      name: 'Fleuriste Exclusif',
      category: 'Fleuriste',
      weddingIds: [w1],
    })

    useWorkspaceStore.getState().deleteWedding(w1)

    const { vendors } = useWorkspaceStore.getState().workspace
    expect(vendors.find((v) => v.id === vendorId)).toBeUndefined()
  })

  it('2. un prestataire lié à un autre mariage est conservé, avec ses weddingIds mis à jour', () => {
    const vendorId = useWorkspaceStore.getState().addVendor({
      name: 'Traiteur Partagé',
      category: 'Traiteur',
      weddingIds: [w1, w2],
    })

    useWorkspaceStore.getState().deleteWedding(w1)

    const { vendors } = useWorkspaceStore.getState().workspace
    const vendor = vendors.find((v) => v.id === vendorId)
    expect(vendor).toBeDefined()
    expect(vendor?.weddingIds).toEqual([w2])
  })

  it("ne supprime aucune tâche, événement ou lien de coût du mariage restant", () => {
    const vendorId = useWorkspaceStore.getState().addVendor({ name: 'DJ', category: 'DJ', weddingIds: [w1, w2] })
    useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w2, { estimatedCost: 800 })
    useWorkspaceStore.getState().addTask({ title: 'Tâche du mariage restant', weddingId: w2, dueDate: '2026-07-01T00:00:00.000Z' })

    useWorkspaceStore.getState().deleteWedding(w1)

    const state = useWorkspaceStore.getState().workspace
    expect(state.tasks.filter((t) => t.weddingId === w2)).toHaveLength(1)
    expect(state.vendorWeddingLinks.find((l) => l.weddingId === w2)?.estimatedCost).toBe(800)
  })
})
