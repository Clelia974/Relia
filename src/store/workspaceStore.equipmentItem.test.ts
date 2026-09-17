import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

/**
 * Checklist matériel (EquipmentItem, Phase 2) : un élément par mariage,
 * jamais partagé ni comptabilisé avec un autre mariage (pas d'inventaire
 * global, cf. schemas/workspace.ts).
 */
describe('workspaceStore — checklist matériel', () => {
  let weddingId: string

  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    weddingId = useWorkspaceStore.getState().createWedding({
      coupleName: 'Mariage A',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 5000,
      clientBudget: 5000,
      status: 'signe',
    })
  })

  it('1. ajoute un élément avec le statut par défaut "à prévoir"', () => {
    const id = useWorkspaceStore.getState().addEquipmentItem({
      weddingId,
      name: 'Chaises pliantes',
      quantity: 80,
      acquisitionMode: 'location',
    })
    const item = useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.id === id)
    expect(item?.status).toBe('a_prevoir')
    expect(item?.quantity).toBe(80)
    expect(item?.acquisitionMode).toBe('location')
  })

  it('2. met à jour un élément (patch général)', () => {
    const id = useWorkspaceStore.getState().addEquipmentItem({
      weddingId,
      name: 'Guirlandes lumineuses',
      quantity: 10,
      acquisitionMode: 'stock_personnel',
    })
    useWorkspaceStore.getState().updateEquipmentItem(id, { quantity: 15, category: 'Décoration' })
    const item = useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.id === id)
    expect(item?.quantity).toBe(15)
    expect(item?.category).toBe('Décoration')
  })

  it('3. met à jour le statut indépendamment (updateEquipmentItemStatus)', () => {
    const id = useWorkspaceStore.getState().addEquipmentItem({
      weddingId,
      name: 'Nappes',
      quantity: 12,
      acquisitionMode: 'achat',
    })
    useWorkspaceStore.getState().updateEquipmentItemStatus(id, 'pret')
    expect(useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.id === id)?.status).toBe('pret')
  })

  it('4. supprime un élément (deleteEquipmentItem)', () => {
    const id = useWorkspaceStore.getState().addEquipmentItem({
      weddingId,
      name: 'Vaisselle',
      quantity: 100,
      acquisitionMode: 'location',
    })
    useWorkspaceStore.getState().deleteEquipmentItem(id)
    expect(useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.id === id)).toBeUndefined()
  })

  it('5. deleteWedding supprime en cascade les éléments du mariage supprimé uniquement', () => {
    const weddingId2 = useWorkspaceStore.getState().createWedding({
      coupleName: 'Mariage B',
      date: '2026-07-06T00:00:00.000Z',
      venue: '',
      soldAmount: 4000,
      clientBudget: 4000,
      status: 'signe',
    })
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location' })
    useWorkspaceStore.getState().addEquipmentItem({ weddingId: weddingId2, name: 'Tables', quantity: 10, acquisitionMode: 'location' })
    expect(useWorkspaceStore.getState().workspace.equipmentItems).toHaveLength(2)

    useWorkspaceStore.getState().deleteWedding(weddingId)

    const remaining = useWorkspaceStore.getState().workspace.equipmentItems
    expect(remaining).toHaveLength(1)
    expect(remaining[0].weddingId).toBe(weddingId2)
  })

  it("6. les quantités de deux mariages différents ne s'influencent jamais (pas d'inventaire partagé)", () => {
    const weddingId2 = useWorkspaceStore.getState().createWedding({
      coupleName: 'Mariage B',
      date: '2026-07-06T00:00:00.000Z',
      venue: '',
      soldAmount: 4000,
      clientBudget: 4000,
      status: 'signe',
    })
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'stock_personnel' })
    useWorkspaceStore.getState().addEquipmentItem({ weddingId: weddingId2, name: 'Chaises', quantity: 30, acquisitionMode: 'stock_personnel' })

    const items = useWorkspaceStore.getState().workspace.equipmentItems
    expect(items.find((e) => e.weddingId === weddingId)?.quantity).toBe(80)
    expect(items.find((e) => e.weddingId === weddingId2)?.quantity).toBe(30)
  })

  it('7. les éléments matériel restent accessibles quand le mariage est archivé', () => {
    const id = useWorkspaceStore.getState().addEquipmentItem({
      weddingId,
      name: 'Chaises',
      quantity: 80,
      acquisitionMode: 'location',
    })
    useWorkspaceStore.getState().archiveWedding(weddingId)
    expect(useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.id === id)).toBeDefined()
  })
})
