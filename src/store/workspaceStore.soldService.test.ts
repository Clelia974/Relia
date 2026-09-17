import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

/**
 * Prestations vendues (SoldService, Phase 1) : matérialisées à partir des
 * lignes incluses d'une proposition APPROUVÉE. generateSoldServicesFromProposal
 * doit être idempotent — jamais de régénération qui écraserait un travail de
 * préparation déjà en cours (cf. schemas/workspace.ts, SoldServiceSchema).
 */
describe('workspaceStore — prestations vendues', () => {
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

  function seedApprovedProposal(weddingIdParam: string) {
    const id = useWorkspaceStore.getState().createProposal({
      weddingId: weddingIdParam,
      template: 'gold',
      title: 'Proposition Gold',
      lineItems: [
        { id: 'li1', description: 'Décoration florale', category: 'Fleuriste', quantity: 1, unitPrice: 800, total: 800, included: true, optional: false, notes: 'Roses blanches' },
        { id: 'li2', description: 'DJ soirée', category: 'DJ', quantity: 1, unitPrice: 600, total: 600, included: true, optional: false },
        { id: 'li3', description: 'Feu d’artifice (option)', category: 'Autre', quantity: 1, unitPrice: 400, total: 400, included: false, optional: true },
      ],
      subtotal: 1400,
      vatMode: 'ne_sait_pas_encore',
      taxAmount: 0,
      total: 1400,
      depositAmount: 0,
      balanceAmount: 1400,
    })
    useWorkspaceStore.getState().updateProposalStatus(id, 'approuvee')
    return id
  }

  it('1. génère une prestation vendue par ligne incluse, avec les bons champs', () => {
    const proposalId = seedApprovedProposal(weddingId)
    const createdIds = useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)

    expect(createdIds).toHaveLength(2)
    const soldServices = useWorkspaceStore.getState().workspace.soldServices
    expect(soldServices).toHaveLength(2)
    const florale = soldServices.find((s) => s.title === 'Décoration florale')
    expect(florale).toBeDefined()
    expect(florale?.weddingId).toBe(weddingId)
    expect(florale?.proposalId).toBe(proposalId)
    expect(florale?.quantity).toBe(1)
    expect(florale?.soldPrice).toBe(800)
    expect(florale?.status).toBe('incluse')
    expect(florale?.notes).toBe('Roses blanches')
    // La ligne optionnelle non incluse ne génère aucune prestation.
    expect(soldServices.find((s) => s.title.includes('artifice'))).toBeUndefined()
  })

  it("2. n'est jamais régénéré en double sur clics répétés (idempotence)", () => {
    const proposalId = seedApprovedProposal(weddingId)
    const first = useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)
    expect(first).toHaveLength(2)

    const second = useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)
    expect(second).toEqual([])
    expect(useWorkspaceStore.getState().workspace.soldServices).toHaveLength(2)
  })

  it("3. ne régénère jamais après une modification manuelle des prestations existantes (aucun écrasement silencieux)", () => {
    const proposalId = seedApprovedProposal(weddingId)
    const [firstId] = useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)
    useWorkspaceStore.getState().updateSoldService(firstId, { title: 'Décoration florale (modifiée)', soldPrice: 950 })

    useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)

    const soldService = useWorkspaceStore.getState().workspace.soldServices.find((s) => s.id === firstId)
    expect(soldService?.title).toBe('Décoration florale (modifiée)')
    expect(soldService?.soldPrice).toBe(950)
    expect(useWorkspaceStore.getState().workspace.soldServices).toHaveLength(2)
  })

  it('4. ne génère rien pour une proposition non approuvée', () => {
    const id = useWorkspaceStore.getState().createProposal({
      weddingId,
      template: 'silver',
      title: 'Brouillon',
      lineItems: [{ id: 'li1', description: 'Test', category: 'Autre', quantity: 1, unitPrice: 100, total: 100, included: true, optional: false }],
      subtotal: 100,
      vatMode: 'ne_sait_pas_encore',
      taxAmount: 0,
      total: 100,
      depositAmount: 0,
      balanceAmount: 100,
    })
    const created = useWorkspaceStore.getState().generateSoldServicesFromProposal(id)
    expect(created).toEqual([])
    expect(useWorkspaceStore.getState().workspace.soldServices).toEqual([])
  })

  it('5. ajoute une prestation manuelle "ajoutée ultérieurement"', () => {
    const proposalId = seedApprovedProposal(weddingId)
    const id = useWorkspaceStore.getState().addSoldService({
      weddingId,
      proposalId,
      title: 'Photobooth (ajout)',
      soldPrice: 250,
    })
    const soldService = useWorkspaceStore.getState().workspace.soldServices.find((s) => s.id === id)
    expect(soldService?.status).toBe('ajoutee_ulterieurement')
    expect(soldService?.soldPrice).toBe(250)
  })

  it('6. met à jour le statut indépendamment (updateSoldServiceStatus)', () => {
    const proposalId = seedApprovedProposal(weddingId)
    const [id] = useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)
    useWorkspaceStore.getState().updateSoldServiceStatus(id, 'retiree')
    expect(useWorkspaceStore.getState().workspace.soldServices.find((s) => s.id === id)?.status).toBe('retiree')
  })

  it('7. supprime une prestation vendue (deleteSoldService)', () => {
    const proposalId = seedApprovedProposal(weddingId)
    const [id] = useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)
    useWorkspaceStore.getState().deleteSoldService(id)
    expect(useWorkspaceStore.getState().workspace.soldServices.find((s) => s.id === id)).toBeUndefined()
  })

  it('8. crée une tâche de préparation depuis une prestation vendue, une seule fois (anti-doublon)', () => {
    const proposalId = seedApprovedProposal(weddingId)
    const [id] = useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)

    const firstTaskId = useWorkspaceStore.getState().createTaskFromSoldService(id)
    expect(firstTaskId).not.toBeNull()
    expect(useWorkspaceStore.getState().workspace.tasks).toHaveLength(1)
    expect(useWorkspaceStore.getState().workspace.soldServices.find((s) => s.id === id)?.taskId).toBe(firstTaskId)

    const secondTaskId = useWorkspaceStore.getState().createTaskFromSoldService(id)
    expect(secondTaskId).toBe(firstTaskId)
    // Aucun second clic ne doit créer une deuxième tâche.
    expect(useWorkspaceStore.getState().workspace.tasks).toHaveLength(1)
  })

  it('9. deleteProposal supprime en cascade les prestations vendues qui en dérivent', () => {
    const proposalId = seedApprovedProposal(weddingId)
    useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)
    expect(useWorkspaceStore.getState().workspace.soldServices).toHaveLength(2)

    useWorkspaceStore.getState().deleteProposal(proposalId)
    expect(useWorkspaceStore.getState().workspace.soldServices).toEqual([])
  })

  it('10. deleteWedding supprime en cascade les prestations vendues du mariage supprimé uniquement', () => {
    const weddingId2 = useWorkspaceStore.getState().createWedding({
      coupleName: 'Mariage B',
      date: '2026-07-06T00:00:00.000Z',
      venue: '',
      soldAmount: 4000,
      clientBudget: 4000,
      status: 'signe',
    })
    const proposal1 = seedApprovedProposal(weddingId)
    const proposal2 = seedApprovedProposal(weddingId2)
    useWorkspaceStore.getState().generateSoldServicesFromProposal(proposal1)
    useWorkspaceStore.getState().generateSoldServicesFromProposal(proposal2)
    expect(useWorkspaceStore.getState().workspace.soldServices).toHaveLength(4)

    useWorkspaceStore.getState().deleteWedding(weddingId)

    const remaining = useWorkspaceStore.getState().workspace.soldServices
    expect(remaining).toHaveLength(2)
    expect(remaining.every((s) => s.weddingId === weddingId2)).toBe(true)
  })

  it('11. les prestations vendues restent accessibles quand le mariage est archivé', () => {
    const proposalId = seedApprovedProposal(weddingId)
    const [id] = useWorkspaceStore.getState().generateSoldServicesFromProposal(proposalId)

    useWorkspaceStore.getState().archiveWedding(weddingId)

    const soldService = useWorkspaceStore.getState().workspace.soldServices.find((s) => s.id === id)
    expect(soldService).toBeDefined()
    expect(useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)?.archived).toBe(true)
  })
})
