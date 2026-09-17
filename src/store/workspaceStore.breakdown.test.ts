import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

/**
 * Suivi de désinstallation (Phase 4) — extension d'EquipmentItem existant,
 * pas de nouvelle entité. createBreakdownTasksForZones doit être idempotent
 * (jamais de tâche de démontage dupliquée sur clics répétés).
 */
describe('workspaceStore — désinstallation (Phase 4)', () => {
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

  it('1. updateEquipmentItem enregistre isDamaged/damageNotes', () => {
    const id = useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location' })
    useWorkspaceStore.getState().updateEquipmentItem(id, { isDamaged: true, damageNotes: 'Pied cassé' })
    const item = useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.id === id)
    expect(item?.isDamaged).toBe(true)
    expect(item?.damageNotes).toBe('Pied cassé')
  })

  it('2. updateEquipmentItem enregistre destination/destinationNotes', () => {
    const id = useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Nappes', quantity: 12, acquisitionMode: 'achat' })
    useWorkspaceStore.getState().updateEquipmentItem(id, { destination: 'stock', destinationNotes: 'Rangée 3' })
    const item = useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.id === id)
    expect(item?.destination).toBe('stock')
    expect(item?.destinationNotes).toBe('Rangée 3')
  })

  it("3. updateEquipmentItemStatus renseigne returnedAt automatiquement au passage à 'recupere'", () => {
    const id = useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Vaisselle', quantity: 100, acquisitionMode: 'location' })
    expect(useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.id === id)?.returnedAt).toBeUndefined()

    useWorkspaceStore.getState().updateEquipmentItemStatus(id, 'recupere')
    const returnedAt = useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.id === id)?.returnedAt
    expect(returnedAt).toBeDefined()
  })

  it('4. ne réécrit jamais returnedAt une fois renseigné (préserve le premier horodatage)', () => {
    const id = useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Vaisselle', quantity: 100, acquisitionMode: 'location' })
    useWorkspaceStore.getState().updateEquipmentItemStatus(id, 'recupere')
    const firstReturnedAt = useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.id === id)?.returnedAt

    useWorkspaceStore.getState().updateEquipmentItemStatus(id, 'installe')
    useWorkspaceStore.getState().updateEquipmentItemStatus(id, 'recupere')
    const secondReturnedAt = useWorkspaceStore.getState().workspace.equipmentItems.find((e) => e.id === id)?.returnedAt

    expect(secondReturnedAt).toBe(firstReturnedAt)
  })

  it('5. createBreakdownTasksForZones crée une tâche par zone restant à récupérer', () => {
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location', category: 'Réception' })
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Guirlandes', quantity: 5, acquisitionMode: 'stock_personnel', category: 'Cérémonie' })

    const created = useWorkspaceStore.getState().createBreakdownTasksForZones(weddingId, '2026-06-06T18:00:00.000Z')

    expect(created).toHaveLength(2)
    const tasks = useWorkspaceStore.getState().workspace.tasks
    expect(tasks.map((t) => t.title).sort()).toEqual(['Démontage : Cérémonie', 'Démontage : Réception'])
    expect(tasks.every((t) => t.phase === 'demontage')).toBe(true)
  })

  it("6. n'est jamais créé en double sur clics répétés (idempotence)", () => {
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location', category: 'Réception' })

    const first = useWorkspaceStore.getState().createBreakdownTasksForZones(weddingId, '2026-06-06T18:00:00.000Z')
    expect(first).toHaveLength(1)

    const second = useWorkspaceStore.getState().createBreakdownTasksForZones(weddingId, '2026-06-06T19:00:00.000Z')
    expect(second).toEqual([])
    expect(useWorkspaceStore.getState().workspace.tasks).toHaveLength(1)
  })

  it("7. une zone déjà récupérée intégralement ne reçoit pas de tâche de démontage", () => {
    const id = useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location', category: 'Réception' })
    useWorkspaceStore.getState().updateEquipmentItemStatus(id, 'recupere')

    const created = useWorkspaceStore.getState().createBreakdownTasksForZones(weddingId, '2026-06-06T18:00:00.000Z')
    expect(created).toEqual([])
  })

  it('8. affecte le prestataire responsable si fourni', () => {
    const vendorId = useWorkspaceStore.getState().addVendor({ name: 'Équipe montage', category: 'Autre', weddingIds: [weddingId] })
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location', category: 'Réception' })

    useWorkspaceStore.getState().createBreakdownTasksForZones(weddingId, '2026-06-06T18:00:00.000Z', vendorId)

    expect(useWorkspaceStore.getState().workspace.tasks[0].vendorId).toBe(vendorId)
  })
})
