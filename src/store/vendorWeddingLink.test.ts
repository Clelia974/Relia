import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

/**
 * Actions du store liées au coût par relation mariage↔prestataire :
 * addVendor (coût initial), setVendorCostForWedding (upsert + marqueur),
 * removeVendorFromWedding (retrait scopé à un mariage), deleteWedding (cascade).
 */
describe('coût prestataire par relation — actions du store', () => {
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

  it("A. prestataire utilisé dans un seul mariage : le coût créé avec addVendor est lié à ce mariage", () => {
    const vendorId = useWorkspaceStore.getState().addVendor({
      name: 'Fleuriste Solo',
      category: 'Fleuriste',
      weddingIds: [w1],
      estimatedCost: 500,
    })
    const links = useWorkspaceStore.getState().workspace.vendorWeddingLinks
    expect(links).toHaveLength(1)
    expect(links[0]).toMatchObject({ vendorId, weddingId: w1, estimatedCost: 500 })
  })

  it('B. prestataire dans deux mariages avec deux coûts différents — aucun mélange', () => {
    const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Traiteur', category: 'Traiteur', weddingIds: [w1] })
    useWorkspaceStore.getState().updateVendor(vendorId, { weddingIds: [w1, w2] })
    useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w1, { estimatedCost: 3000 })
    useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w2, { estimatedCost: 4500 })

    const links = useWorkspaceStore.getState().workspace.vendorWeddingLinks
    const linkW1 = links.find((l) => l.weddingId === w1)
    const linkW2 = links.find((l) => l.weddingId === w2)
    expect(linkW1?.estimatedCost).toBe(3000)
    expect(linkW2?.estimatedCost).toBe(4500)
  })

  it('C. prestataire dans deux mariages avec un seul coût renseigné', () => {
    const vendorId = useWorkspaceStore.getState().addVendor({ name: 'DJ', category: 'DJ', weddingIds: [w1] })
    useWorkspaceStore.getState().updateVendor(vendorId, { weddingIds: [w1, w2] })
    useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w1, { estimatedCost: 1100 })

    const links = useWorkspaceStore.getState().workspace.vendorWeddingLinks
    expect(links.find((l) => l.weddingId === w1)?.estimatedCost).toBe(1100)
    expect(links.find((l) => l.weddingId === w2)).toBeUndefined()
  })

  it('7. modifier le coût efface needsCostReview sur le lien modifié', () => {
    useWorkspaceStore.setState((state) => ({
      workspace: {
        ...state.workspace,
        vendors: [{ id: 'v1', name: 'Test', category: 'Autre', weddingIds: [w1, w2] }],
        vendorWeddingLinks: [
          { id: 'l1', vendorId: 'v1', weddingId: w1, status: 'a_contacter' as const, estimatedCost: 1000, needsCostReview: true },
          { id: 'l2', vendorId: 'v1', weddingId: w2, status: 'a_contacter' as const, estimatedCost: 1000, needsCostReview: true },
        ],
      },
    }))

    // Même valeur qu'avant : la vérification, pas le changement, doit effacer le marqueur.
    useWorkspaceStore.getState().setVendorCostForWedding('v1', w1, { estimatedCost: 1000 })

    const links = useWorkspaceStore.getState().workspace.vendorWeddingLinks
    expect(links.find((l) => l.weddingId === w1)?.needsCostReview).toBeUndefined()
  })

  it("8. modifier le coût d'un mariage ne modifie pas le marqueur de l'autre mariage", () => {
    useWorkspaceStore.setState((state) => ({
      workspace: {
        ...state.workspace,
        vendors: [{ id: 'v1', name: 'Test', category: 'Autre', weddingIds: [w1, w2] }],
        vendorWeddingLinks: [
          { id: 'l1', vendorId: 'v1', weddingId: w1, status: 'a_contacter' as const, estimatedCost: 1000, needsCostReview: true },
          { id: 'l2', vendorId: 'v1', weddingId: w2, status: 'a_contacter' as const, estimatedCost: 2000, needsCostReview: true },
        ],
      },
    }))

    useWorkspaceStore.getState().setVendorCostForWedding('v1', w1, { estimatedCost: 1500 })

    const links = useWorkspaceStore.getState().workspace.vendorWeddingLinks
    expect(links.find((l) => l.weddingId === w1)?.needsCostReview).toBeUndefined()
    expect(links.find((l) => l.weddingId === w2)?.needsCostReview).toBe(true)
    expect(links.find((l) => l.weddingId === w2)?.estimatedCost).toBe(2000)
  })

  it('9. un lien nouvellement créé via setVendorCostForWedding ne porte jamais needsCostReview', () => {
    const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Photographe', category: 'Photographe', weddingIds: [w1] })
    useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w1, { estimatedCost: 800 })
    const link = useWorkspaceStore.getState().workspace.vendorWeddingLinks.find((l) => l.vendorId === vendorId)
    expect(link?.needsCostReview).toBeUndefined()
  })

  it('E. modifier un coût avec upsert ne crée jamais de second lien pour la même paire', () => {
    const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Traiteur', category: 'Traiteur', weddingIds: [w1], estimatedCost: 1000 })
    useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w1, { estimatedCost: 1200 })
    useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w1, { estimatedCost: 1300 })

    const links = useWorkspaceStore.getState().workspace.vendorWeddingLinks.filter((l) => l.vendorId === vendorId && l.weddingId === w1)
    expect(links).toHaveLength(1)
    expect(links[0].estimatedCost).toBe(1300)
  })

  describe('removeVendorFromWedding', () => {
    it('1. prestataire lié à un seul mariage — retrait supprime le vendor globalement', () => {
      const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Solo', category: 'Autre', weddingIds: [w1], estimatedCost: 300 })
      useWorkspaceStore.getState().removeVendorFromWedding(vendorId, w1)

      const { vendors, vendorWeddingLinks } = useWorkspaceStore.getState().workspace
      expect(vendors.find((v) => v.id === vendorId)).toBeUndefined()
      expect(vendorWeddingLinks.find((l) => l.vendorId === vendorId)).toBeUndefined()
    })

    it('2-3. prestataire lié à deux mariages — retrait depuis le premier ne supprime que ce lien', () => {
      const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Partagé', category: 'Traiteur', weddingIds: [w1] })
      useWorkspaceStore.getState().updateVendor(vendorId, { weddingIds: [w1, w2] })
      useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w1, { estimatedCost: 1000 })
      useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w2, { estimatedCost: 2000 })

      useWorkspaceStore.getState().removeVendorFromWedding(vendorId, w1)

      const { vendors, vendorWeddingLinks } = useWorkspaceStore.getState().workspace
      const vendor = vendors.find((v) => v.id === vendorId)
      expect(vendor).toBeDefined()
      expect(vendor?.weddingIds).toEqual([w2])
      expect(vendorWeddingLinks.find((l) => l.weddingId === w1)).toBeUndefined()
      // 6. Conservation des coûts et données de l'autre mariage.
      expect(vendorWeddingLinks.find((l) => l.weddingId === w2)?.estimatedCost).toBe(2000)
    })

    it('4-5. retrait depuis le second mariage (dernier lien) supprime le vendor entièrement', () => {
      const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Partagé', category: 'Traiteur', weddingIds: [w1] })
      useWorkspaceStore.getState().updateVendor(vendorId, { weddingIds: [w1, w2] })
      useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w1, { estimatedCost: 1000 })
      useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w2, { estimatedCost: 2000 })

      useWorkspaceStore.getState().removeVendorFromWedding(vendorId, w1)
      useWorkspaceStore.getState().removeVendorFromWedding(vendorId, w2)

      const { vendors, vendorWeddingLinks } = useWorkspaceStore.getState().workspace
      expect(vendors.find((v) => v.id === vendorId)).toBeUndefined()
      expect(vendorWeddingLinks.filter((l) => l.vendorId === vendorId)).toHaveLength(0)
    })

    it("7. conserve les tâches et événements de l'autre mariage, nettoie ceux du mariage concerné", () => {
      const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Partagé', category: 'DJ', weddingIds: [w1] })
      useWorkspaceStore.getState().updateVendor(vendorId, { weddingIds: [w1, w2] })
      const taskW1 = useWorkspaceStore.getState().addTask({ title: 'Tâche w1', weddingId: w1, vendorId })
      const taskW2 = useWorkspaceStore.getState().addTask({ title: 'Tâche w2', weddingId: w2, vendorId })

      useWorkspaceStore.getState().removeVendorFromWedding(vendorId, w1)

      const { tasks } = useWorkspaceStore.getState().workspace
      expect(tasks.find((t) => t.id === taskW1)?.vendorId).toBeUndefined()
      expect(tasks.find((t) => t.id === taskW2)?.vendorId).toBe(vendorId)
    })

    it('8. aucun VendorWeddingLink orphelin après un retrait partiel ou une suppression complète', () => {
      const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Partagé', category: 'Fleuriste', weddingIds: [w1] })
      useWorkspaceStore.getState().updateVendor(vendorId, { weddingIds: [w1, w2] })
      useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w1, { estimatedCost: 100 })
      useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w2, { estimatedCost: 200 })

      useWorkspaceStore.getState().removeVendorFromWedding(vendorId, w1)
      let { vendors, vendorWeddingLinks } = useWorkspaceStore.getState().workspace
      const validVendorIds = new Set(vendors.map((v) => v.id))
      expect(vendorWeddingLinks.every((l) => validVendorIds.has(l.vendorId))).toBe(true)
      expect(vendorWeddingLinks.every((l) => vendors.find((v) => v.id === l.vendorId)?.weddingIds.includes(l.weddingId))).toBe(true)

      useWorkspaceStore.getState().removeVendorFromWedding(vendorId, w2)
      ;({ vendors, vendorWeddingLinks } = useWorkspaceStore.getState().workspace)
      expect(vendorWeddingLinks.filter((l) => l.vendorId === vendorId)).toHaveLength(0)
    })
  })

  it('D. deleteWedding supprime le lien du mariage supprimé et conserve celui du mariage restant', () => {
    const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Partagé', category: 'Traiteur', weddingIds: [w1] })
    useWorkspaceStore.getState().updateVendor(vendorId, { weddingIds: [w1, w2] })
    useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w1, { estimatedCost: 1000 })
    useWorkspaceStore.getState().setVendorCostForWedding(vendorId, w2, { estimatedCost: 2000 })

    useWorkspaceStore.getState().deleteWedding(w1)

    const { vendors, vendorWeddingLinks } = useWorkspaceStore.getState().workspace
    expect(vendorWeddingLinks.find((l) => l.weddingId === w1)).toBeUndefined()
    expect(vendorWeddingLinks.find((l) => l.weddingId === w2)?.estimatedCost).toBe(2000)
    // Le vendor reste, toujours lié à w2.
    expect(vendors.find((v) => v.id === vendorId)?.weddingIds).toEqual([w2])
  })
})
